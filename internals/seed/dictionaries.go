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
	defer db.Close()

	if err := seedCollection[Special](app, db, models.SPECIALS_COLLECTION_NAME); err != nil {
		return err
	}

	if err := seedCollection[Element](app, db, models.ELEMENTS_COLLECTION_NAME); err != nil {
		return err
	}

	if err := seedCollection[CharacterRole](app, db, models.CHARACTER_ROLES_COLLECTION_NAME); err != nil {
		return err
	}

	if err := seedCollection[ArtifactSet](app, db, models.ARTIFACT_SETS_COLLECTION_NAME); err != nil {
		return err
	}

	if err := seedCollection[ArtifactType](app, db, models.ARTIFACT_TYPES_COLLECTION_NAME); err != nil {
		return err
	}

	if err := seedCollection[DomainOfBlessing](app, db, models.DOMAINS_OF_BLESSING_COLLECTION_NAME); err != nil {
		return err
	}

	if err := seedCollection[WeaponType](app, db, models.WEAPON_TYPES_COLLECTION_NAME); err != nil {
		return err
	}

	if err := seedCollection[Weapon](app, db, models.WEAPONS_COLLECTION_NAME); err != nil {
		return err
	}

	if err := seedCollection[Character](app, db, models.CHARACTERS_COLLECTION_NAME); err != nil {
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
	if _, err := models.UpsertAppSettings(app, "dictionaryVersion", fmt.Sprintf("%x", h.Sum(nil))); err != nil {
		return err
	}

	return nil
}
