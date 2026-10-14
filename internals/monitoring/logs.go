package monitoring

import (
	"context"
	"io"
	"log/slog"
	"maps"
	"slices"

	"github.com/pocketbase/pocketbase/core"
)

// bindLogMirror writes every app log entry persisted into _logs to w as a JSON
// line, so it ends up in the container output. Entries PocketBase drops
// (below the min level, or logs retention set to 0) are not mirrored either.
func bindLogMirror(app core.App, w io.Writer) {
	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{Level: slog.Level(-100)})
	// Not OnModelAfterCreateSuccess: PocketBase saves a batch of logs in one
	// transaction reusing a single *core.Log, so by the time the after-commit
	// hooks run every event points at the last entry of the batch.
	app.OnModelCreate(core.LogsTableName).BindFunc(func(e *core.ModelEvent) error {
		if err := e.Next(); err != nil {
			return err
		}
		if l, ok := e.Model.(*core.Log); ok {
			writeLog(handler, l)
		}
		return nil
	})
}

func writeLog(handler slog.Handler, l *core.Log) {
	r := slog.NewRecord(l.Created.Time(), slog.Level(l.Level), l.Message, 0)
	for _, k := range slices.Sorted(maps.Keys(l.Data)) {
		r.AddAttrs(slog.Any(k, l.Data[k]))
	}
	_ = handler.Handle(context.Background(), r)
}
