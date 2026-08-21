package seed

import (
	"os"

	"github.com/pocketbase/pocketbase/core"

	"github.com/qxuken/gbp/internals/models"
)

// Files bundled next to the binary holding the dictionary shipped with the build.
const (
	PRELOAD_SEED_FILE = "seed.db"
	PRELOAD_SEED_HASH = "seed.hash"
	PRELOAD_SEED_NOTE = "seed.note"
)

// UpdateFromPreload applies the bundled seed file unless its hash already
// matches the current dictionary version or the latest stored dump.
func UpdateFromPreload(app core.App, latestDumpCache *models.LatestDbDumpCache) error {
	app.Logger().Debug("Checking " + PRELOAD_SEED_HASH)
	hash, err := os.ReadFile(PRELOAD_SEED_HASH)
	if err != nil {
		return err
	}
	note, _ := os.ReadFile(PRELOAD_SEED_NOTE)

	dictionaryVersion, err := models.FindAppSettingsByKey(app, "dictionaryVersion")
	if err == nil && dictionaryVersion != nil && dictionaryVersion.Value() == string(hash) {
		app.Logger().Debug("No seed update required")
		return nil
	}
	latestDump, err := latestDumpCache.Get(app)
	if err == nil && latestDump.Hash() == string(hash) {
		app.Logger().Debug("No seed update required")
		return nil
	}

	if err := SaveDump(app, PRELOAD_SEED_FILE, string(note)); err != nil {
		return err
	}
	return Seed(app, PRELOAD_SEED_FILE)
}
