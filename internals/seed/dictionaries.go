package seed

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/qxuken/gbp/internals/models"
	"github.com/spf13/cobra"
)

func NewCobraSeedCommand(app core.App) *cobra.Command {
	return &cobra.Command{
		Use:     "seed seed_file",
		Aliases: []string{"s"},
		Short:   "Seed command",
		Args:    cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			return Seed(app, args[0])
		},
	}
}

func NewCobraSeedHashCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "hash seed_file [dest_file]",
		Short: "Generate hash command",
		Args:  cobra.MatchAll(cobra.MinimumNArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			hash, err := GetSeedHash(args[0])
			if err != nil {
				return err
			}
			fmt.Println(hash)
			if len(args) <= 1 {
				return nil
			}
			fd, err := os.Create(args[1])
			if err != nil {
				return err
			}
			_, err = fd.WriteString(hash)
			return err
		},
	}
}

func GetSeedHash(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	_, err = io.Copy(h, f)
	if err != nil {
		return "", err
	}
	hashStr := fmt.Sprintf("%x", h.Sum(nil))
	return hashStr, err
}

func UpdateDictionaryVersion(app core.App, path string) error {
	hash, err := GetSeedHash(path)
	if err != nil {
		return err
	}
	app.Logger().Debug("Seed Hash " + hash)
	if _, err := models.UpsertAppSettings(app, "dictionaryVersion", hash); err != nil {
		return err
	}
	return nil
}

func Seed(app core.App, path string) error {
	app.Logger().Info("Seeding")
	app.Logger().Debug(fmt.Sprintf("seed db path %#v", path))

	db, err := core.DefaultDBConnect(path)
	if err != nil {
		return err
	}
	defer db.Close()

	err = app.RunInTransaction(func(txApp core.App) error {
		if err := seedCollection[Special](txApp, db, models.SPECIALS_COLLECTION_NAME); err != nil {
			return err
		}

		if err := seedCollection[Element](txApp, db, models.ELEMENTS_COLLECTION_NAME); err != nil {
			return err
		}

		if err := seedCollection[CharacterRole](txApp, db, models.CHARACTER_ROLES_COLLECTION_NAME); err != nil {
			return err
		}

		if err := seedCollection[ArtifactSet](txApp, db, models.ARTIFACT_SETS_COLLECTION_NAME); err != nil {
			return err
		}

		if err := seedCollection[ArtifactType](txApp, db, models.ARTIFACT_TYPES_COLLECTION_NAME); err != nil {
			return err
		}

		if err := seedCollection[DomainOfBlessing](txApp, db, models.DOMAINS_OF_BLESSING_COLLECTION_NAME); err != nil {
			return err
		}

		if err := seedCollection[WeaponType](txApp, db, models.WEAPON_TYPES_COLLECTION_NAME); err != nil {
			return err
		}

		if err := seedCollection[Weapon](txApp, db, models.WEAPONS_COLLECTION_NAME); err != nil {
			return err
		}

		if err := seedCollection[Character](txApp, db, models.CHARACTERS_COLLECTION_NAME); err != nil {
			return err
		}

		if err := UpdateDictionaryVersion(txApp, path); err != nil {
			return err
		}
		return nil
	})

	if err == nil {
		app.Logger().Info("Seed Completed")
	}

	return err
}

func NewCobraDumpCommand(app core.App) *cobra.Command {
	return &cobra.Command{
		Use:     "dump seed_file",
		Aliases: []string{"d"},
		Short:   "Dump command",
		Args:    cobra.MatchAll(cobra.MinimumNArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			var notes string
			if len(args) > 1 {
				notes = args[1]
			}
			return Dump(app, args[0], notes)
		},
	}
}

func SaveDump(app core.App, path string, notes string) error {
	hash, err := GetSeedHash(path)
	if err != nil {
		return err
	}
	app.Logger().Info("Hash " + hash)

	collection, err := app.FindCollectionByNameOrId(models.DB_DUMPS_COLLECTION_NAME)
	if err != nil {
		return err
	}
	record := core.NewRecord(collection)
	record.Set("hash", hash)
	dumpfile, err := filesystem.NewFileFromPath(path)
	if err != nil {
		return err
	}
	record.Set("dump", dumpfile)
	record.Set("notes", notes)

	return app.Save(record)
}

func Dump(app core.App, path string, notes string) error {
	app.Logger().Info("Dumping db")
	app.Logger().Debug(fmt.Sprintf("seed db path %#v", path))

	fsys, err := app.NewFilesystem()
	if err != nil {
		return err
	}
	defer fsys.Close()

	db, err := core.DefaultDBConnect(path)
	if err != nil {
		return err
	}

	err = app.RunInTransaction(func(txApp core.App) error {
		return db.Transactional(func(txDb *dbx.Tx) error {
			if err := createSpecialsTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[Special](txApp, fsys, txDb, models.SPECIALS_COLLECTION_NAME); err != nil {
				return err
			}

			if err := createElementsTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[Element](txApp, fsys, txDb, models.ELEMENTS_COLLECTION_NAME); err != nil {
				return err
			}

			if err := createCharacterRolesTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[CharacterRole](txApp, fsys, txDb, models.CHARACTER_ROLES_COLLECTION_NAME); err != nil {
				return err
			}

			if err := createArtifactSetsTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[ArtifactSet](txApp, fsys, txDb, models.ARTIFACT_SETS_COLLECTION_NAME); err != nil {
				return err
			}

			if err := createArtifactTypesTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[ArtifactType](txApp, fsys, txDb, models.ARTIFACT_TYPES_COLLECTION_NAME); err != nil {
				return err
			}

			if err := createDomainsOfBlessingTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[DomainOfBlessing](txApp, fsys, txDb, models.DOMAINS_OF_BLESSING_COLLECTION_NAME); err != nil {
				return err
			}

			if err := createWeaponTypesTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[WeaponType](txApp, fsys, txDb, models.WEAPON_TYPES_COLLECTION_NAME); err != nil {
				return err
			}

			if err := createWeaponsTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[Weapon](txApp, fsys, txDb, models.WEAPONS_COLLECTION_NAME); err != nil {
				return err
			}

			if err := createCharactersTable(txDb); err != nil {
				return err
			}
			if err := dumpCollection[Character](txApp, fsys, txDb, models.CHARACTERS_COLLECTION_NAME); err != nil {
				return err
			}

			return nil
		})
	})
	if err != nil {
		return err
	}
	app.Logger().Info("Dump Completed")
	db.Close()

	return SaveDump(app, path, notes)
}
