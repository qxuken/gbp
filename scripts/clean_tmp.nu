export def main [] {
	["pb_data", "migrations"] | each { |p| $'tmp/($p)' } | filter {|p| ($p | path exists)} | each {|p| rm -r $p}
}
