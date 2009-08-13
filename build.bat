md dist
copy chrome.manifest dist
copy install.rdf dist
svn export chrome dist/chrome

cd dist/chrome
7z a -tzip "restclient.jar" * -r -mx=0
move "restclient.jar" ..\
cd ..
rd chrome /s/q
md chrome
move restclient.jar chrome
7z a -tzip "restclient.xpi" * -r -mx=9
move "restclient.xpi" ..\
cd ..
rd dist /s/q
