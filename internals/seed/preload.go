package seed

import (
	"database/sql"
	"errors"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase/core"

	"github.com/qxuken/gbp/internals/models"
)

// Files bundled next to the binary holding the dictionary shipped with the build.
const (
	PRELOAD_SEED_FILE = "seed.db"
	PRELOAD_SEED_HASH = "seed.hash"
	PRELOAD_SEED_NOTE = "seed.note"
)

// UpdateFromPreload applies the bundled seed file unless the database already
// has it.
//
// "Already has it" covers two cases:
//
//   - the collections were built from that seed, i.e. dictionaryVersion matches;
//   - the seed is stored as a dump. A stored dump means the seed was applied at
//     some point, so whatever the dictionary looks like now is the result of a
//     later deliberate change (a newer dump, a manual restore) and re-applying
//     the bundled file would roll it back.
func UpdateFromPreload(app core.App) error {
	app.Logger().Debug("Checking " + PRELOAD_SEED_HASH)
	rawHash, err := os.ReadFile(PRELOAD_SEED_HASH)
	if err != nil {
		return err
	}
	hash := strings.TrimSpace(string(rawHash))
	note, _ := os.ReadFile(PRELOAD_SEED_NOTE)

	dictionaryVersion, err := models.FindAppSettingsByKey(app, "dictionaryVersion")
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	if dictionaryVersion != nil && dictionaryVersion.Value() == hash {
		app.Logger().Debug("No seed update required, dictionary is already at " + hash)
		return nil
	}

	dump, err := models.FindDbDumpByHash(app, hash)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	if dump != nil {
		app.Logger().Debug("No seed update required, seed " + hash + " is already stored as a dump")
		return nil
	}

	app.Logger().Info("Applying preloaded seed " + hash)
	if err := SaveDump(app, PRELOAD_SEED_FILE, string(note)); err != nil {
		return err
	}
	return Seed(app, PRELOAD_SEED_FILE)
}
