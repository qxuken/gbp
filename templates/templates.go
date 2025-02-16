package templates

import (
	"regexp"

	"github.com/pocketbase/pocketbase/tools/template"

	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
	"github.com/tdewolff/minify/v2/html"
	"github.com/tdewolff/minify/v2/js"
	"github.com/tdewolff/minify/v2/json"
	"github.com/tdewolff/minify/v2/svg"
	"github.com/tdewolff/minify/v2/xml"
)

type Templates struct {
	Index        string
	SignIn       string
	SignUp       string
	ConfirmEmail string
	NotFound     string
}

func NewTemplates() (*Templates, error) {
	m := minify.New()
	m.AddFunc("text/css", css.Minify)
	m.AddFunc("text/html", html.Minify)
	m.AddFunc("image/svg+xml", svg.Minify)
	m.AddFuncRegexp(regexp.MustCompile("^(application|text)/(x-)?(java|ecma)script$"), js.Minify)
	m.AddFuncRegexp(regexp.MustCompile("[/+]json$"), json.Minify)
	m.AddFunc("importmap", json.Minify)
	m.AddFuncRegexp(regexp.MustCompile("[/+]xml$"), xml.Minify)
	registry := template.NewRegistry()
	index, err := renderIndex(registry)
	if err != nil {
		return nil, err
	}
	index, err = m.String("text/html", index)
	if err != nil {
		return nil, err
	}
	signIn, err := renderSignIn(registry)
	if err != nil {
		return nil, err
	}
	signIn, err = m.String("text/html", signIn)
	if err != nil {
		return nil, err
	}
	signUp, err := renderSignUp(registry)
	if err != nil {
		return nil, err
	}
	signUp, err = m.String("text/html", signUp)
	if err != nil {
		return nil, err
	}
	confirmEmail, err := renderConfirmEmail(registry)
	if err != nil {
		return nil, err
	}
	confirmEmail, err = m.String("text/html", confirmEmail)
	if err != nil {
		return nil, err
	}
	notFound, err := renderError(registry, "Not Found", false)
	if err != nil {
		return nil, err
	}
	notFound, err = m.String("text/html", notFound)
	if err != nil {
		return nil, err
	}
	return &Templates{index, signIn, signUp, confirmEmail, notFound}, nil
}

func renderIndex(registry *template.Registry) (string, error) {
	return registry.LoadFiles(
		"templates/pages/layout.html",
		"templates/pages/index.html",
	).Render(map[string]any{})
}

func renderSignIn(registry *template.Registry) (string, error) {
	return registry.LoadFiles(
		"templates/pages/layout.html",
		"templates/pages/signin.html",
	).Render(map[string]any{})
}

func renderSignUp(registry *template.Registry) (string, error) {
	return registry.LoadFiles(
		"templates/pages/layout.html",
		"templates/pages/signup.html",
	).Render(map[string]any{})
}

func renderConfirmEmail(registry *template.Registry) (string, error) {
	return registry.LoadFiles(
		"templates/pages/layout.html",
		"templates/pages/confirm_email.html",
	).Render(map[string]any{})
}

func renderError(registry *template.Registry, errorText string, showReload bool) (string, error) {
	return registry.LoadFiles(
		"templates/pages/layout.html",
		"templates/pages/error_page.html",
	).Render(map[string]any{
		"ErrorText":  errorText,
		"ShowReload": showReload,
	})
}
