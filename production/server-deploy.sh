#!/usr/bin/env bash
set -euo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin

revision=${1:-}
[[ $# == 1 && $revision =~ ^[a-f0-9]{40}$ ]] || { echo 'A full revision SHA is required.' >&2; exit 1; }
[[ $EUID == 0 ]] || { echo 'Run the installed deployment wrapper as root.' >&2; exit 1; }
state=/var/lib/wishes-production
repo=$state/source.git
site=/srv/wishes
exec 9>"$state/deploy.lock"
flock -x 9

# Independently fetch trusted main. The CI key cannot upload files or run a shell.
export GIT_SSH_COMMAND='ssh -i /root/.ssh/wishes-production-source -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes'
git --git-dir="$repo" fetch --prune origin '+refs/heads/main:refs/remotes/origin/main'
current=$(git --git-dir="$repo" rev-parse refs/remotes/origin/main)
[[ $current == "$revision" ]] || { echo "Stale deployment: main is $current, candidate is $revision." >&2; exit 1; }

# Static releases may contain regular files and directories only, never symlinks.
git --git-dir="$repo" ls-tree -r "$revision:site" | \
  awk '$1 != "100644" && $1 != "100755" { bad=1 } END { exit bad }'
release="$site/releases/$revision"
task_tmp=$(mktemp -d "$site/releases/.pending-XXXXXX")
old=$(readlink "$site/current" || true)
activated=false
finished=false
cleanup() {
  if [[ $activated == true && $finished != true ]]; then
    if [[ -n $old ]]; then
      ln -s "$old" "$site/.rollback"
      mv -Tf "$site/.rollback" "$site/current"
    else
      rm -f "$site/current"
    fi
  fi
  rm -rf -- "$task_tmp"
  rm -f "$site/.next"
}
trap cleanup EXIT
git --git-dir="$repo" archive "$revision:site" | tar -x -C "$task_tmp" --no-same-owner
[[ -s "$task_tmp/index.html" && -s "$task_tmp/app.js" && -s "$task_tmp/styles.css" ]]
printf '%s\n' "$revision" > "$task_tmp/__revision"
find "$task_tmp" -type d -exec chmod 0755 {} +
find "$task_tmp" -type f -exec chmod 0644 {} +
if [[ -d $release ]]; then
  diff -qr "$release" "$task_tmp"
else
  mv "$task_tmp" "$release"
fi
ln -s "$release" "$site/.next"
mv -Tf "$site/.next" "$site/current"
activated=true
actual=$(curl --fail --silent --show-error -H 'Host: wishes.ks-design.art' http://127.0.0.1/__revision)
[[ $actual == "$revision" ]] || { echo 'Origin revision verification failed.' >&2; exit 1; }
finished=true
echo "Published wishes revision $revision."
