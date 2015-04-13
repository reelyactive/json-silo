rm -rf silo.db
rm -rf node_modules/json-silo
cp -R ../../../json-silo/bin node_modules/json-silo
cp -R ../../../json-silo/lib node_modules/json-silo
cp -R ../../../json-silo/node_modules node_modules/json-silo
cp ../../../json-silo/package.json node_modules/json-silo
cp ../../../json-silo/LICENSE node_modules/json-silo
cp ../../../json-silo/README.md node_modules/json-silo
node server.js