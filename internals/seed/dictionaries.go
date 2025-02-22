package seed

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/qxuken/gbp/internals/models"
	"github.com/spf13/cobra"
)

func NewCobraCommand(app core.App) *cobra.Command {
	return &cobra.Command{
		Use:     "seed seed_file",
		Aliases: []string{"s"},
		Short:   "Seeding command",
		Args:    cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			return Seed(app, args[0])
		},
	}
}

func Seed(app core.App, path string) error {
	app.Logger().Info("Seeding")
	app.Logger().Debug(fmt.Sprintf("seed db path %#v", path))

	db, err := core.DefaultDBConnect(path)
	if err != nil {
		return err
	}

	if err := seedCollection[Special](app, db, "specials"); err != nil {
		return err
	}

	if err := seedCollection[Element](app, db, "elements"); err != nil {
		return err
	}

	if err := seedCollection[CharacterRole](app, db, "character_roles"); err != nil {
		return err
	}

	if err := seedCollection[ArtifactSet](app, db, "artifact_sets"); err != nil {
		return err
	}

	if err := seedCollection[ArtifactType](app, db, "artifact_types"); err != nil {
		return err
	}

	if err := seedCollection[WeaponType](app, db, "weapon_types"); err != nil {
		return err
	}

	if err := seedCollection[Weapon](app, db, "weapons"); err != nil {
		return err
	}

	if err := seedCollection[Character](app, db, "characters"); err != nil {
		return err
	}

	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return err
	}
	if _, err := models.UpsertAppSettings(app, "dictionary_version", fmt.Sprintf("%x", h.Sum(nil))); err != nil {
		return err
	}

	return nil
}
