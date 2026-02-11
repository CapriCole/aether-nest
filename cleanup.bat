@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "feat(auth): add setup-admin route for initial admin creation"
"%GIT%" push origin main
del cleanup.bat
