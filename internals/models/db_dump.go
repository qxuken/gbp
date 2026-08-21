package models

import (
	"database/sql"
	"path"
	"sync"

	"github.com/pocketbase/pocketbase/core"
)

// ensures that the DbDump struct satisfy the core.RecordProxy interface
var _ core.RecordProxy = (*DbDump)(nil)

type DbDump struct {
	core.BaseRecordProxy
}

func (d *DbDump) Hash() string {
	return d.GetString("hash")
}

func (d *DbDump) Notes() string {
	return d.GetString("notes")
}

func (d *DbDump) DumpFilename() string {
	return d.GetString("dump")
}

// DumpDir is the on disk directory holding the dump file.
func (d *DbDump) DumpDir(app core.App) string {
	return path.Join(app.DataDir(), "storage", d.BaseFilesPath())
}

// DumpPath is the full on disk path of the dump file.
func (d *DbDump) DumpPath(app core.App) string {
	return path.Join(d.DumpDir(app), d.DumpFilename())
}

func FindDbDumpById(app core.App, id string) (*DbDump, error) {
	rec, err := app.FindRecordById(DB_DUMPS_COLLECTION_NAME, id)
	if err != nil {
		return nil, err
	}
	dump := &DbDump{}
	dump.SetProxyRecord(rec)
	return dump, nil
}

// FindLatestDbDump returns the most recently created dump
// or sql.ErrNoRows if there is none.
func FindLatestDbDump(app core.App) (*DbDump, error) {
	records, err := app.FindRecordsByFilter(DB_DUMPS_COLLECTION_NAME, "", "-created", 1, 0)
	if err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return nil, sql.ErrNoRows
	}
	dump := &DbDump{}
	dump.SetProxyRecord(records[0])
	return dump, nil
}

// LatestDbDumpCache keeps the latest dump record in memory so that the hot
// read paths (seed download, seed info) don't hit the db on every request.
// The cache is dropped whenever the dumps collection changes, see Bind.
type LatestDbDumpCache struct {
	mutex sync.RWMutex
	dump  *DbDump
}

func NewLatestDbDumpCache() *LatestDbDumpCache {
	return &LatestDbDumpCache{}
}

// Bind subscribes the cache to the dumps collection changes.
func (c *LatestDbDumpCache) Bind(app core.App) {
	invalidate := func(e *core.RecordEvent) error {
		c.Invalidate()
		return e.Next()
	}
	app.OnRecordAfterCreateSuccess(DB_DUMPS_COLLECTION_NAME).BindFunc(invalidate)
	app.OnRecordAfterUpdateSuccess(DB_DUMPS_COLLECTION_NAME).BindFunc(invalidate)
	app.OnRecordAfterDeleteSuccess(DB_DUMPS_COLLECTION_NAME).BindFunc(invalidate)
}

func (c *LatestDbDumpCache) Invalidate() {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.dump = nil
}

// Get returns the cached latest dump, loading it on the first call after an
// invalidation. Returns sql.ErrNoRows if there are no dumps.
func (c *LatestDbDumpCache) Get(app core.App) (*DbDump, error) {
	c.mutex.RLock()
	dump := c.dump
	c.mutex.RUnlock()
	if dump != nil {
		return dump, nil
	}

	c.mutex.Lock()
	defer c.mutex.Unlock()
	if c.dump != nil {
		return c.dump, nil
	}
	dump, err := FindLatestDbDump(app)
	if err != nil {
		return nil, err
	}
	c.dump = dump
	return dump, nil
}
