#!/usr/bin/env bash
set -euo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
[[ $EUID == 0 ]] || { echo 'Run as root on the production host.' >&2; exit 1; }
key=/root/.ssh/wishes-production-source
if [[ ${1:-} == source-key && $# == 1 ]]; then
  if [[ ! -f $key ]]; then
    umask 077
    ssh-keygen -q -t ed25519 -N '' -C wishes-production-source -f "$key"
  fi
  cat "$key.pub"
  exit 0
fi
[[ $# == 1 && -f $1 && -f $key ]] || { echo 'Supply the CI public-key file after registering the source key.' >&2; exit 1; }
public_key=$(<"$1")
[[ $public_key =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+(\ [A-Za-z0-9@._-]+)?$ ]] || { echo 'Invalid Ed25519 public key.' >&2; exit 1; }
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
state=/var/lib/wishes-production
install -d -m 0700 "$state"
install -d -m 0755 /srv/wishes /srv/wishes/releases
if [[ ! -d $state/source.git ]]; then
  git init --bare "$state/source.git"
  git --git-dir="$state/source.git" remote add origin git@github.com:kiaquila/wishes.git
fi
[[ $(git --git-dir="$state/source.git" remote get-url origin) == git@github.com:kiaquila/wishes.git ]]
GIT_SSH_COMMAND="ssh -i $key -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes" \
  git --git-dir="$state/source.git" fetch origin '+refs/heads/main:refs/remotes/origin/main'
install -o root -g root -m 0755 "$script_dir/server-deploy.sh" /usr/local/sbin/wishes-production-deploy
install -o root -g root -m 0755 "$script_dir/ssh-command.sh" /usr/local/sbin/wishes-production-ssh-command
if ! id wishesdeploy >/dev/null 2>&1; then
  useradd --system --home-dir /var/lib/wishesdeploy --shell /bin/bash wishesdeploy
fi
install -d -o root -g wishesdeploy -m 0750 /var/lib/wishesdeploy /var/lib/wishesdeploy/.ssh
printf 'restrict,command="/usr/local/sbin/wishes-production-ssh-command" %s\n' "$public_key" > /var/lib/wishesdeploy/.ssh/authorized_keys
chown root:wishesdeploy /var/lib/wishesdeploy/.ssh/authorized_keys
chmod 0640 /var/lib/wishesdeploy/.ssh/authorized_keys
task_tmp=$(mktemp)
trap 'rm -f -- "$task_tmp"' EXIT
printf 'wishesdeploy ALL=(root) NOPASSWD: /usr/local/sbin/wishes-production-deploy *\n' > "$task_tmp"
visudo -cf "$task_tmp"
install -o root -g root -m 0440 "$task_tmp" /etc/sudoers.d/wishes-production
echo 'Installed isolated wishes deployment access.'
