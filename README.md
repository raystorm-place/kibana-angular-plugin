# Kibana Angular
Display documents in angular syntax with the Angular Widget Plugin for Kibana.

# Install

```bash
bin/kibana plugin -i kibana-angular-plugin -u https://github.com/raystorm-place/kibana-angular-plugin/releases/download/v0.0.2/kibana-angular-plugin-v0.0.2.tar.gz
```

# Example

Render docs with angular
```html
<div class="panel-heading gravity" role="tab" id="gravity-edit-heading-{{$index}}">
	<div class="row">
		<div class="col-md-7">
			<img src="{{doc.fields.image}}" class="img-responsive" alt="thumbnail" />
		</div>
		<div ng-class="{true:'col-md-9 col-xs-7', false:'col-md-12 col-xs-9'}[doc.fields.image!=null]">
			<a role="button">
				<h4 class="panel-title">{{doc.fields.title}}</h4>
			</a>
		</div>
	</div>
</div>
```

# Compatibility
Plugins are officialy not supported, because of fast code changes even in minor Versions.

The plugin is compatible with following Versions (other not tested yet):
* kibana (=4.x)

