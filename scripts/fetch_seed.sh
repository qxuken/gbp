#!/usr/bin/env sh
#
# Downloads the dictionary seed that the Dockerfile bakes into the image.
#
# The seed is not tracked in git (backup/* is gitignored), so builds pull it
# from a running deployment instead: SEED_HOSTS is a whitespace separated list
# of origins, tried in order, until one serves a dump whose payload matches the
# sha256 it advertises on /api/dump/latest. The first host that answers with an
# intact dump wins, the rest are the fallback.
#
# Usage:
#   scripts/fetch_seed.sh [dest_dir]                 # dest_dir defaults to ./backup
#   SEED_HOSTS='https://a https://b' scripts/fetch_seed.sh
#
# Writes <dest_dir>/seed.db and <dest_dir>/seed.note. The matching seed.hash is
# generated from the file by `gbp hash` during the Docker build.

set -eu

DEST_DIR="${1:-backup}"
SEED_HOSTS="${SEED_HOSTS:-https://gbp.qxuken.dev https://genshinbuild.app}"
META_TIMEOUT="${SEED_META_TIMEOUT:-30}"
FILE_TIMEOUT="${SEED_FILE_TIMEOUT:-600}"

if ! command -v jq >/dev/null 2>&1; then
	echo "fetch_seed: jq is required but was not found in PATH" >&2
	exit 1
fi

# sha256sum on linux, shasum on macos
sha256_of() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | cut -d ' ' -f 1
	else
		shasum -a 256 "$1" | cut -d ' ' -f 1
	fi
}

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

for host in $SEED_HOSTS; do
	host=${host%/}
	echo "fetch_seed: trying $host"

	if ! curl -fsSL --max-time "$META_TIMEOUT" "$host/api/dump/latest" -o "$tmp_dir/latest.json"; then
		echo "fetch_seed: $host did not serve /api/dump/latest, trying the next host" >&2
		continue
	fi

	# an unknown path on a host running the app is answered by the spa with a
	# 200 and an html body, so a successful request is not yet a valid answer
	expected_hash=$(jq -r '.hash // empty' "$tmp_dir/latest.json" 2>/dev/null || true)
	case $expected_hash in
	*[!0-9a-f]* | "")
		echo "fetch_seed: $host reported no usable dump hash, trying the next host" >&2
		continue
		;;
	esac

	if ! curl -fsSL --max-time "$FILE_TIMEOUT" "$host/api/dump/latest_seed.db" -o "$tmp_dir/seed.db"; then
		echo "fetch_seed: $host did not serve the dump payload, trying the next host" >&2
		continue
	fi

	actual_hash=$(sha256_of "$tmp_dir/seed.db")
	if [ "$actual_hash" != "$expected_hash" ]; then
		echo "fetch_seed: $host served a corrupt dump (want $expected_hash, got $actual_hash), trying the next host" >&2
		continue
	fi

	jq -r '.notes // ""' "$tmp_dir/latest.json" > "$tmp_dir/seed.note"

	mkdir -p "$DEST_DIR"
	mv "$tmp_dir/seed.db" "$DEST_DIR/seed.db"
	mv "$tmp_dir/seed.note" "$DEST_DIR/seed.note"

	echo "fetch_seed: took the seed from $host"
	echo "fetch_seed:   sha256 $expected_hash"
	echo "fetch_seed:   notes  $(cat "$DEST_DIR/seed.note")"
	echo "fetch_seed:   saved to $DEST_DIR/seed.db"
	exit 0
done

echo "fetch_seed: no host in SEED_HOSTS served a usable dump ($SEED_HOSTS)" >&2
exit 1
