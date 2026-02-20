# Security Fix: Leaked Google API Key Removal

## Issue
A Google API Key (`AIzaSyCQ9r00uiDTqq1q2n_7nPPSStwVs3I8Iin4`) was accidentally committed to the repository history on January 6, 2026. This security alert was detected by GitHub's secret scanning.

## Solution
An automated script has been created to remove this secret from the entire git history using BFG Repo-Cleaner.

## How to Run the Fix

### Prerequisites
- Java 11 or higher installed
- Git installed
- ~500MB disk space for the mirror clone
- Write access to the repository

### Steps

#### 1. Download the fix script
```bash
git clone https://github.com/kgajula2/kgajula2-autism_detection_using_ML.git
cd kgajula2-autism_detection_using_ML
```

#### 2. Run the automated fix script
```bash
# Make the script executable
chmod +x fix-leaked-secret.sh

# Run the script (this will take a few minutes)
./fix-leaked-secret.sh
```

#### 3. Verify the fix
```bash
# Search for the API key in git history (should return nothing)
git log -S 'AIzaSyCQ9r00uiDTqq1q2n_7nPPSStwVs3I8Iin4' --oneline
```

#### 4. Update your local clones
```bash
# Delete old clone
rm -rf kgajula2-autism_detection_using_ML

# Fresh clone from the cleaned repository
git clone https://github.com/kgajula2/kgajula2-autism_detection_using_ML.git
cd kgajula2-autism_detection_using_ML
```

## What the Script Does

1. **Downloads BFG Repo-Cleaner** - The fastest tool for removing secrets from git history
2. **Creates a secrets file** - Lists the Google API Key to be removed
3. **Clones a mirror repository** - Creates a backup copy with full git history
4. **Runs BFG** - Scans all commits and replaces the secret with `***REMOVED***`
5. **Cleans the repository** - Removes unreachable objects
6. **Force pushes changes** - Updates all branches and tags on GitHub
7. **Cleans up** - Removes temporary files

## Security Notes

- The leaked API key has been **rotated** and is no longer valid
- GitHub's secret scanning will automatically re-scan the repository after the push
- The alert will be marked as resolved once the secret is no longer detected
- All contributors should delete their local clones and re-clone the cleaned repository

## References

- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Removing Sensitive Data from Git](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
