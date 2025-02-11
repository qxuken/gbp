package seed

import (
	"fmt"

	"github.com/pocketbase/pocketbase/core"
	"github.com/spf13/cobra"
)

func Seed(app core.App) error {
	logger := app.Logger()
	logger.Info("Seeding")
	return nil
}

func NewCobraCommand(app core.App) *cobra.Command {
	return &cobra.Command{
		Use:     "seed [SCOPE]",
		Aliases: []string{"s"},
		Short:   "Seeding command",
		Args:    cobra.MatchAll(cobra.MaximumNArgs(1), cobra.OnlyValidArgs),
		RunE: func(cmd *cobra.Command, args []string) error {
			app.Logger().Debug(fmt.Sprintf("%#v", cmd))
			app.Logger().Debug(fmt.Sprintf("args %#v", args))
			return Seed(app)
		},
	}
}
