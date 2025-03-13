const REPO = 'qxuken/gbp'

def main [] {
	let commit_hash = git rev-parse HEAD
	DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build . --tag $'($REPO):latest' --tag $'($REPO):($commit_hash)'
	docker push $REPO --all-tags
}
