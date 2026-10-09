#!/usr/bin/env bash
set -euo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
[[ $EUID == 0 && $# == 1 && $1 =~ ^[a-f0-9]{40}$ ]] || { echo 'Run as root with the reviewed main SHA.' >&2; exit 1; }
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
site=/etc/nginx/sites-available/wishes.ks-design.art.conf
enabled=/etc/nginx/sites-enabled/wishes.ks-design.art.conf
task_tmp=$(mktemp -d)
had_previous=false
finished=false
if [[ -f $site ]]; then cp -a "$site" "$task_tmp/previous"; had_previous=true; fi
cleanup() {
  if [[ $finished != true ]]; then
    if [[ $had_previous == true ]]; then
      install -m 0644 "$task_tmp/previous" "$site"
    else
      rm -f -- "$enabled" "$site"
    fi
    nginx -t && systemctl reload nginx
  fi
  rm -rf -- "$task_tmp"
}
trap cleanup EXIT
# Keep existing TLS live during refreshes; HTTP is needed only on first setup.
if [[ ! -f $site || ! -f /etc/letsencrypt/live/wishes.ks-design.art/fullchain.pem ]]; then
  install -m 0644 "$script_dir/wishes-http.conf" "$site"
  ln -sfn "$site" "$enabled"
  nginx -t
  systemctl reload nginx
fi
/usr/local/sbin/wishes-production-deploy "$1"
certbot certonly --webroot --webroot-path /var/www/certbot \
  --cert-name wishes.ks-design.art --domains wishes.ks-design.art \
  --non-interactive --keep-until-expiring
install -m 0644 "$script_dir/wishes.conf" "$site"
ln -sfn "$site" "$enabled"
nginx -t
systemctl reload nginx
actual=$(curl --fail --silent --show-error --resolve wishes.ks-design.art:443:127.0.0.1 https://wishes.ks-design.art/__revision)
[[ $actual == "$1" ]]
finished=true
echo 'Installed wishes HTTPS edge.'
