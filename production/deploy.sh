#!/usr/bin/env bash
set -euo pipefail

[[ ${REVISION:-} =~ ^[a-f0-9]{40}$ ]] || { echo 'A full revision SHA is required.' >&2; exit 1; }
[[ ${WISHES_SSH_HOST:-} =~ ^[a-zA-Z0-9.-]+$ ]] || { echo 'Invalid SSH host.' >&2; exit 1; }
[[ -n ${WISHES_SSH_PRIVATE_KEY:-} && -n ${WISHES_SSH_KNOWN_HOSTS:-} ]]
umask 077
task_tmp=$(mktemp -d)
trap 'rm -rf -- "$task_tmp"' EXIT
printf '%s\n' "$WISHES_SSH_PRIVATE_KEY" > "$task_tmp/key"
printf '%s\n' "$WISHES_SSH_KNOWN_HOSTS" > "$task_tmp/known_hosts"
unset WISHES_SSH_PRIVATE_KEY

ssh -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes \
  -o UserKnownHostsFile="$task_tmp/known_hosts" -i "$task_tmp/key" \
  "wishesdeploy@$WISHES_SSH_HOST" "deploy $REVISION"

node scripts/verify-production.mjs "$REVISION"
