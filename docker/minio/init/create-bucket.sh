#!/bin/sh
set -eu

until mc alias set pulsechat http://minio:9000 minioadmin minioadmin; do
  echo "Waiting for MinIO to accept connections..."
  sleep 2
done

mc mb --ignore-existing pulsechat/pulsechat
mc anonymous set private pulsechat/pulsechat