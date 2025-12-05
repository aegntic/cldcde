Here's how you would implement a `<Countdown :start-time="number" />` component in Vanilla JavaScript/EcmaScript (no framework) and popular frameworks/libraries Vue, Svelte, and React.

---

## 1\. Vanilla JavaScript (Web component)

### HTML
```html
<count-down start-time="60"></count-down>
```

### JavaScript (countdown.js)
```js
class CountDown extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.count = parseInt(this.getAttribute('start-time'), 10) || 0;

    this.shadowRoot.innerHTML = `<div id="counter">${this.count}</div>`;
  }

  connectedCallback() {
    this.interval = setInterval(() => {
      if (this.count > 0) {
        this.count--;
        this.shadowRoot.querySelector('#counter').textContent = this.count;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }
}

customElements.define('count-down', CountDown);
```

### Usage
```html
<script src="countdown.js"></script>
<count-down start-time="60"></count-down>
```

---

## 2\. Vue 3 (Composition API):

### Countdown.vue
```vue
<script setup>
import { ref, onMounted, onUnmounted, defineProps } from 'vue';

const props = defineProps({ startTime: { type: Number, default: 60 } });
const count = ref(props.startTime);
let timer;

onMounted(() => {
  timer = setInterval(() => {
    if (count.value > 0) {
      count.value--;
    } else {
      clearInterval(timer);
    }
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <div>{{ count }}</div>
</template>
```

### Usage:
```vue
<Countdown :start-time="60" />
```

---

## 3\. Svelte

### Countdown.svelte
```svelte
<script>
  export let startTime = 60;
  let count = startTime;
  let interval = null;

  interval = setInterval(() => {
    if (count > 0) {
      count -= 1;
    } else {
      clearInterval(interval);
    }
  }, 1000);

  // cleanup
  import { onDestroy } from 'svelte';
  onDestroy(() => clearInterval(interval));
</script>

<div>{count}</div>
```

### Usage:
```svelte
<Countdown startTime={60} />
```

---

## 4\. React

### Countdown.jsx
```jsx
import React, { useState, useEffect } from 'react';

export default function Countdown({ startTime = 60 }) {
  const [count, setCount] = useState(startTime);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setInterval(() => setCount(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [count]);

  return <div>{count}</div>;
}
```

### Usage:
```jsx
<Countdown startTime={60} />
```

---  

### Summary:

| Implementation | Syntax & Concepts                           |
|----------------|---------------------------------------------|
| Vanilla        | Web Components, Shadow DOM, setInterval()   |
| Vue            | Composition API, reactivity, lifecycle hooks|
| Svelte         | Direct reactivity, lifecycle hooks          |
| React          | JSX, hooks, useEffect, useState             |