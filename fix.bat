@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "fix dependencies: update lockfile"
"%GIT%" push origin main
