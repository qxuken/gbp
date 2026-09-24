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
# The fallback hosts may well be serving an older seed than the first one, so
# falling back is fine for a build that only needs *a* seed but wrong for a
# release. SEED_STRICT=1 only ever tries the first host and fails if it does not
# answer with an intact dump.
#
# Usage:
#   scripts/fetch_seed.sh [dest_dir]                 # dest_dir defaults to ./backup
#   SEED_HOSTS='https://a https://b' scripts/fetch_seed.sh
#   SEED_STRICT=1 scripts/fetch_seed.sh
#
# Writes <dest_dir>/seed.db and <dest_dir>/seed.note. The matching seed.hash is
# generated from the file by `gbp hash` during the Docker build.
#
# On GitHub Actions a skipped host is raised as a warning annotation and the
# seed that was taken is written to the job summary.

set -eu

DEST_DIR="${1:-backup}"
SEED_HOSTS="${SEED_HOSTS:-https://gbp.qxuken.dev https://genshinbuild.app}"
SEED_STRICT="${SEED_STRICT:-0}"
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

# annotate <warning|error> <message>
annotate() {
	echo "fetch_seed: $2" >&2
	if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
		echo "::$1 title=fetch_seed::$2"
	fi
}

# fetch <url> <timeout> <dest>
#
# Sets fetch_error on failure. The status and the answering server are kept, a
# refusal from a proxy in front of the app reads very differently from the app
# itself answering 404.
fetch() {
	fetch_error=""
	if ! status=$(curl -sSL --max-time "$2" -D "$tmp_dir/headers" -o "$3" -w '%{http_code}' "$1"); then
		fetch_error="request failed"
		return 1
	fi
	case $status in
	2??) return 0 ;;
	esac
	server=$(grep -i '^server:' "$tmp_dir/headers" 2>/dev/null | tail -n 1 | cut -d ':' -f 2- | tr -d '\r' | sed 's/^ *//' || true)
	fetch_error="HTTP $status${server:+ from $server}"
	return 1
}

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

if [ "$SEED_STRICT" = "1" ]; then
	# shellcheck disable=SC2086 # split the list on purpose
	set -- $SEED_HOSTS
	SEED_HOSTS=$1
	echo "fetch_seed: strict, only $SEED_HOSTS is accepted"
fi

for host in $SEED_HOSTS; do
	host=${host%/}
	echo "fetch_seed: trying $host"

	if ! fetch "$host/api/dump/latest" "$META_TIMEOUT" "$tmp_dir/latest.json"; then
		annotate warning "$host did not serve /api/dump/latest ($fetch_error), skipping it"
		continue
	fi

	# an unknown path on a host running the app is answered by the spa with a
	# 200 and an html body, so a successful request is not yet a valid answer
	expected_hash=$(jq -r '.hash // empty' "$tmp_dir/latest.json" 2>/dev/null || true)
	case $expected_hash in
	*[!0-9a-f]* | "")
		annotate warning "$host reported no usable dump hash, skipping it"
		continue
		;;
	esac

	if ! fetch "$host/api/dump/latest_seed.db" "$FILE_TIMEOUT" "$tmp_dir/seed.db"; then
		annotate warning "$host did not serve the dump payload ($fetch_error), skipping it"
		continue
	fi

	actual_hash=$(sha256_of "$tmp_dir/seed.db")
	if [ "$actual_hash" != "$expected_hash" ]; then
		annotate warning "$host served a corrupt dump (want $expected_hash, got $actual_hash), skipping it"
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

	if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
		{
			echo "### Dictionary seed"
			echo
			echo "| | |"
			echo "| --- | --- |"
			echo "| host | $host |"
			echo "| sha256 | \`$expected_hash\` |"
			echo "| notes | $(tr '\n|' ' /' < "$DEST_DIR/seed.note") |"
		} >> "$GITHUB_STEP_SUMMARY"
	fi
	exit 0
done

if [ "$SEED_STRICT" = "1" ]; then
	annotate error "$SEED_HOSTS did not serve a usable dump and SEED_STRICT forbids falling back to another host"
else
	annotate error "no host in SEED_HOSTS served a usable dump ($SEED_HOSTS)"
fi
exit 1
