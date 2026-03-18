#!/bin/bash

echo "🚀 배포 시작..."

git add .

read -p "커밋 메시지 입력: " msg

git commit -m "$msg"

git push

echo "✅ 배포 완료!"