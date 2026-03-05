#!/bin/bash
# Script untuk push ke GitHub
# Jalankan: ./push-to-github.sh

cd /home/z/my-project

echo "=== Pushing to GitHub ==="
echo "Repository: https://github.com/edho9228/neon-erp"
echo ""

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "There are uncommitted changes. Committing..."
    git add -A
    git commit -m "Auto commit before push"
fi

echo "Commits ready to push:"
git log origin/master..HEAD --oneline 2>/dev/null || git log -3 --oneline

echo ""
echo "Pushing to origin master..."
git push origin master

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Vercel will auto-deploy from GitHub."
else
    echo ""
    echo "❌ Push failed. You may need to authenticate."
    echo "Try: git push origin master"
fi
