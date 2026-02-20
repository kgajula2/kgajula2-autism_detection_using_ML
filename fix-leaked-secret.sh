#!/bin/bash
# Auto-fix script for leaked Google API Key in git history
# This script uses BFG Repo-Cleaner to remove the secret

set -e

echo "=== Leaked Secret Removal Script ==="
echo "Target: Google API Key (AIzaSyCQ9r00uiDTqq1q2n_7nPPSStwVs3I8Iin4)"
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "ERROR: Java is required but not installed. Please install Java 11 or higher."
    exit 1
fi

echo "Step 1: Downloading BFG Repo-Cleaner..."
if [ ! -f "bfg.jar" ]; then
    curl -L https://repo1.maven.org/maven2/com/madgag/bfg/1.15.0/bfg-1.15.0.jar -o bfg.jar
fi

echo "Step 2: Creating secrets file..."
echo "AIzaSyCQ9r00uiDTqq1q2n_7nPPSStwVs3I8Iin4" > secrets.txt

echo "Step 3: Cloning mirror repository..."
if [ -d "autism-detection.git" ]; then
    rm -rf autism-detection.git
fi
git clone --mirror https://github.com/kgajula2/kgajula2-autism_detection_using_ML.git autism-detection.git

echo "Step 4: Running BFG to remove secrets from history..."
java -jar bfg.jar --replace-text secrets.txt autism-detection.git

echo "Step 5: Cleaning git repository..."
cd autism-detection.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Step 6: Force pushing cleaned repository..."
git push --force --all
git push --force --tags

echo ""
echo "=== Cleanup ==="
cd ..
rm secrets.txt

echo ""
echo "=== SUCCESS ==="
echo "The leaked secret has been removed from git history."
echo "GitHub will automatically re-scan the repository."
echo ""
echo "Next steps:"
echo "1. Delete your local clones"
echo "2. Run: git clone https://github.com/kgajula2/kgajula2-autism_detection_using_ML.git"
echo "3. Verify the secret is gone: git log -S 'AIzaSyCQ9r00uiDTqq1q2n_7nPPSStwVs3I8Iin4' --oneline"
echo ""
