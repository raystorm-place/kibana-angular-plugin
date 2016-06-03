# Dev
Install dependencies, clear plugin cache, redeploy and restart

```bash
cd ~/tmp/kibana-angular-plugin
bower install

cd kibana
rm -rf ./optimize/*
cp -R ~/tmp/kibana-angular-plugin ./src/plugins/
bin/kibana
```

# Release

```bash
tar -czf kibana-angular-plugin-v0.0.x.tar.gz --exclude .git --exclude .idea --exclude *.iml --exclude src-noconflict --exclude src --exclude src-min --exclude demo kibana-angular-plugin
```

## Debug scope

1. Open Firebug
2. Select HTML
3. Enter `angular.element($0).scope()` in console