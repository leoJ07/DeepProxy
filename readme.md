
# DeepProxy

Uses the [`Proxy`](https://javascript.info/proxy) class to detect changes in an object and it's subobjects. 


## Usage/Examples

### Import

Import using html:

```html
<script src="PATH TO FILE"></script>

<script>
    let deepProxy = new DeepProxy();
</script>
```

You can also use this url insted of downloading the file <br />https://leoj07.github.io/DeepProxy/DeepProxy.js

### Add Events

You can add event using the .on() function

```javascript
deepProxy.on(DeepProxy.Events.SET, (event) => {
  console.log("Set event detected");
});
```

You can also chain the events

```javascript
deepProxy
    .on(DeepProxy.Events.SET, (event) => {
        console.log("Set event detected");
    })
    .on(DeepProxy.Events.Get, (event) => {
        console.log("Get event detected");
    });
```

### Remove Events

You can remove events using the .remove() function
```javascript
deepProxy.remove(DeepProxy.Events.SET);
```

This is also chainable

```javascript
deepProxy
    .remove(DeepProxy.Events.SET)
    .remove(DeepProxy.Events.Get)
```

### Proxy

Use the .proxy property to get the monitored object

```javascript
let object = deepProxy.proxy;
```
## API

### `new DeepProxy(source, settings)`

**Paramaters:**
| Parameter   | Type                              | Description                                      |
| :---------- |:--------------------------------- | :-----------------------------                   |
| `source`    | `Object` or `Function` or `array` | **Optional**. Object to convert into a Proxy     |
| `settings`  | `Object`                          | **Optional**. Object containing all the settings |

**Settings:**
| Setting                   | Default                   | Description                                      |
| :------------------------ |:---------------------- | :-----------------------------                   |
| `as_handler`              | `false` | Uses the settings object as the proxy's [handler](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). <br/>If true none of the other settings will work.  |
| `default_action`          | `true`  | Does the default action automatically when a event is called. <br/>The object will work as normal without you doing anything. <br/>If set to `false` `contain_function_events` will automatically be deactivated |
| `contain_function_events` | `false` | Doesent call events thats fiered during a function call. <br/>You can access all the canceled events in `Event.events` in the `FUNCTION_CALL` events |
| `path_as_array`           | `false` | Automaticly formats the path at in events to be <br/>an `array` insted of a `string`.  |

### `.on(event, callback(e))`

| Parameter     | Type                | Description                                                                                                      |
| :------------ | :------------------ | :--------------------------------------------------------------------------------------------------------------- |
| `event`       | `DeepProxt.Event.*` | The event you vant the function to be called on. <br />Use the static enum `DeepProxy.Events`                    |
| `callback(e)` | `function`          | Function to be called on the event. The first argument <br/>is a `object` containing information about the event |

### `.remove(event)`

| Parameter | Type                | Description                                                                |
| :-------- | :------------------ | :------------------------------------------------------------------------- |
| `event`   | `DeepProxt.Event.*` | The event you want to remove. <br />Use the static enum `DeepProxy.Events` |

### `.proxy`

Read-only field used to access the root proxy. 

### `DeepProxy.Events`
When returning `DeepProxy.Events.CANCELED` the default action will automatically be done

<details>
<summary>SET</summary>

### Return `boolean`
Returnvalue should depend on wheter or not the value was set correctly

### Attributes

| Attribute    | Type                              | Description                                     |
| :----------- | :-------------------------------- | :---------------------------------------------- |
| `target`     | `object` or `function` or `array` | The target the value is assigned to             |
| `key`        | `string`                          | The property of the object thats being assigned |
| `value`      | `any`                             | The value being assigned to the key             |
| `proxy`      | `object` or `function` or `array` | The `Proxy` varient of the target               |
| `targetPath` | `string` or `array`               | The path to the target from the root proxy      |
| `valuePath`  | `string` or `array`               | The path to the value from the root proxy       |

</details>

<details>
<summary>GET</summary>

### Return `any`
The return value should depend on what the attribute contains

### Attributes

| Attribute    | Type                              | Description                                     |
| :----------- | :-------------------------------- | :---------------------------------------------- |
| `target`     | `object` or `function` or `array` | The target the value is assigned to             |
| `key`        | `string`                          | The property of the object thats being assigned |
| `proxy`      | `object` or `function` or `array` | The `Proxy` varient of the target               |
| `targetPath` | `string` or `array`               | The path to the target from the root proxy      |
| `valuePath`  | `string` or `array`               | The path to the value from the root proxy       |

</details>

<details>
<summary>DELETE</summary>

### Return `boolean`
The return value should depend on if the attribute was deleted succesfully

### Attributes

| Attribute    | Type                              | Description                                     |
| :----------- | :-------------------------------- | :---------------------------------------------- |
| `target`     | `object` or `function` or `array` | The target the value is assigned to             |
| `key`        | `string`                          | The property of the object thats being assigned |
| `targetPath` | `string` or `array`               | The path to the target from the root proxy      |
| `valuePath`  | `string` or `array`               | The path to the value from the root proxy       |

</details>

<details>
<summary>FUNCTION_CALL</summary>

### Return `any`
The return value should depend on what the function returned

### Attributes

| Attribute     | Type                | Description                                          |
| :------------ | :------------------ | :--------------------------------------------------- |
| `events`      | `array`             | The events that was called during the function call  |
| `target`      | `function`          | The target the value is assigned to                  |
| `name`        | `string`            | The name of the function in the parrent object       |
| `args`        | `array`             | The arguments used in the function call              |
| `parentProxy` | `object`            | The proxy varient of the parent object               |
| `parentPath`  | `string` or `array` | The path to the target's parrent from the root proxy |
| `targetPath`  | `string` or `array` | The path to the target from the root proxy           |

</details>

<details>
<summary>CONSTRUCTOR_CALL</summary>

### Return `object`
The return value should depend on what the constructor returned

### Attributes

| Attribute     | Type                | Description                                          |
| :------------ | :------------------ | :--------------------------------------------------- |
| `target`      | `function`          | The target the value is assigned to                  |
| `name`        | `string`            | The name of the class in the parrent object          |
| `args`        | `array`             | The arguments used in the function call              |
| `proxy`       | `object`            | The proxy varient of the target object               |
| `targetPath`  | `string` or `array` | The path to the target from the root proxy           |
| `valuePath`   | `string` or `array` | The path to the value from the root proxy            |

</details>

<details>
<summary>CANCELED</summary>

This isn't a callable event but rather a return type for the events.  
If this event is returned from anather event the event will be canceled and the default action will be done.

</details>


### `DeepProxy.formatPath(path)`



| Parameter | Type                 | Description                       |
| :-------- | :------------------- | :-------------------------------- |
| `path`    | `string` or `object` | **Required**. The path to convert. <br/>If it's an object it converts every string attribute of the object |

