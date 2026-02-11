@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" config --global user.name "CapriCole"
"%GIT%" config --global user.email "colecolin619@gmail.com"
"%GIT%" init
"%GIT%" add .
"%GIT%" commit -m "Initial commit"
"%GIT%" remote add origin https://github.com/CapriCole/aether-nest.git
"%GIT%" branch -M main
"%GIT%" push -u origin main
