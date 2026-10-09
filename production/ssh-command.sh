#!/usr/bin/env bash
set -euo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
if [[ ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([a-f0-9]{40})$ ]]; then
  exec sudo -n /usr/local/sbin/wishes-production-deploy "${BASH_REMATCH[1]}"
fi
echo 'Only deploy <full SHA> is allowed.' >&2
exit 1
