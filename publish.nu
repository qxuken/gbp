use 'std/log'

const REPO = 'qxuken/gbp'
const OS = "linux"
const ARCH = [
	"amd64"
	"arm64"
]
const MAIN_ARCH = $ARCH.0

def arches [] { $ARCH }

def image-tag [arch: string, commit_hash: string] {
	$'($REPO):($arch)-($commit_hash)'
}

export def main [
	--main-arch (-m): string@arches = $MAIN_ARCH
	--no-push
] {
	let commit_hash = git rev-parse HEAD
	for arch in $ARCH {
		let target = $"($OS)/($arch)"
		let tag = image-tag $arch $commit_hash
		log info $"Building ($target)"
		log debug $"Tag ($tag)"
		DOCKER_DEFAULT_PLATFORM=$target docker build . --tag $tag
	}
	log debug $"Aliasing"
	docker tag (image-tag $main_arch $commit_hash) $'($REPO):latest'
	docker tag (image-tag $main_arch $commit_hash) $'($REPO):($commit_hash)'
	if not $no_push {
		push
	} else {
		log debug $"Skipping push"
	}
}

export def push [] {
	docker push $REPO --all-tags
}
