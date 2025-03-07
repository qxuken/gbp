export def replaceToCamel [needle: string] {
	rg $needle --files-with-matches | lines | each {|f| no $f | str replace -a -m $needle ($needle | str camel-case) | save $f -f}
}
