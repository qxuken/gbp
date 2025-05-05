const REPO = 'qxuken/gbp'
const OS = "linux"
const ARCH = [
	"amd64"
	"arm64"
]

def arches [] { $ARCH }

export def main [--mainArch (-m): string@arches = "amd64" ] {
	let commit_hash = git rev-parse HEAD
	for arch in $ARCH {
		DOCKER_DEFAULT_PLATFORM=$"($OS)/($arch)" docker build . --tag $'($REPO):($arch)-($commit_hash)'
	}
	docker tag $'($REPO):($mainArch)-($commit_hash)' $'($REPO):latest'
	docker tag $'($REPO):($mainArch)-($commit_hash)' $'($REPO):($commit_hash)'
	docker push $REPO --all-tags
}
