def 'main ui' [] {
	cd ui
	npm ci
	npm run build
}
alias ui = main ui

export def 'main binary' [
	dist_dir: string = './dist'
] {
	let out_file = if (sys host | get name) == 'Windows' {
		'gbp.exe'
	} else {
		'gbp'
	}
	mkdir $dist_dir
	let out = $dist_dir | path join $out_file
	go build -o $out .
}
alias binary = main binary

export def main [
	dist_dir: string = './dist'
] {
	ui
	binary $dist_dir
}
