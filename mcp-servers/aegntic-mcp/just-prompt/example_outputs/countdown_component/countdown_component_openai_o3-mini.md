Below are complete implementations of a countdown timer component that meets your requirements for Vue.js, Svelte, React, and plain Vanilla JavaScript. In each version the component accepts a “start-time” (number, seconds) and “format” (0 = MM:SS, 1 = HH:MM:SS), counts down until zero, stops, emits (or calls back) a “finished” event when done, and displays a visual cue (red color) when remaining time falls below 10% of the original time.

────────────────────────
1. Vue.js (Vue 3 – Single File Component)
────────────────────────
<!-- CountdownTimer.vue -->
<template>
  <!-- Apply a red text color when below 10% of starting time -->
  <div :style="{ color: isLow ? 'red' : 'black' }">
    {{ formattedTime }}
  </div>
</template>

<script>
export default {
  name: "CountdownTimer",
  props: {
    startTime: {
      type: Number,
      required: true
    },
    format: {
      type: Number,
      default: 0 // 0 = MM:SS, 1 = HH:MM:SS
    }
  },
  data() {
    return {
      remaining: this.startTime, // remaining seconds
      timer: null
    };
  },
  computed: {
    isLow() {
      // mark as low if remaining time is below 10% of original start time
      return this.remaining <= this.startTime * 0.1;
    },
    formattedTime() {
      // Format the remaining seconds according to the 'format' prop.
      let secs = this.remaining;
      if (this.format === 0) { // MM:SS
        const minutes = Math.floor(secs / 60);
        const seconds = secs % 60;
        return `${this.pad(minutes)}:${this.pad(seconds)}`;
      } else { // HH:MM:SS
        const hours = Math.floor(secs / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        const seconds = secs % 60;
        return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
      }
    }
  },
  methods: {
    pad(num) {
      return String(num).padStart(2, "0");
    },
    startTimer() {
      // Start countdown with an interval of 1 second.
      this.timer = setInterval(() => {
        if (this.remaining > 0) {
          this.remaining--;
        } else {
          clearInterval(this.timer);
          // Emit a 'finished' event when countdown completes.
          this.$emit("finished");
        }
      }, 1000);
    }
  },
  mounted() {
    this.startTimer();
  },
  beforeUnmount() {
    clearInterval(this.timer);
  }
};
</script>

<!-- Sample usage in a parent component -->
<template>
  <div>
    <CountdownTimer :startTime="120" :format="0" @finished="onFinished" />
  </div>
</template>

<script>
import CountdownTimer from './CountdownTimer.vue';

export default {
  components: { CountdownTimer },
  methods: {
    onFinished() {
      console.log("Countdown complete!");
    }
  }
};
</script>

────────────────────────
2. Svelte
────────────────────────
<!-- CountdownTimer.svelte -->
<script>
  import { onMount, onDestroy, createEventDispatcher } from "svelte";

  export let startTime; // total starting seconds
  export let format = 0; // 0 = MM:SS, 1 = HH:MM:SS

  let remaining = startTime; // remaining time in seconds
  let timer;
  const dispatch = createEventDispatcher();

  // Helper function to pad numbers to two digits.
  function pad(num) {
    return String(num).padStart(2, "0");
  }

  // Compute formatted time.
  $: formattedTime = format === 0
    ? `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`
    : `${pad(Math.floor(remaining / 3600))}:${pad(Math.floor((remaining % 3600) / 60))}:${pad(remaining % 60)}`;

  // Visual indication when time is low (<10% left).
  $: isLow = remaining <= startTime * 0.1;

  function startTimer() {
    timer = setInterval(() => {
      if (remaining > 0) {
        remaining = remaining - 1;
      } else {
        clearInterval(timer);
        dispatch("finished");
      }
    }, 1000);
  }

  onMount(startTimer);
  onDestroy(() => clearInterval(timer));
</script>

<style>
  .low {
    color: red;
  }
  .normal {
    color: black;
  }
</style>

<div class:{isLow ? "low" : "normal"}>
  {formattedTime}
</div>

<!-- Sample usage (App.svelte) -->
<script>
  import CountdownTimer from "./CountdownTimer.svelte";

  function handleFinished() {
    console.log("Countdown complete!");
  }
</script>

<CountdownTimer startTime={120} format={0} on:finished={handleFinished} />

────────────────────────
3. React (Functional Component with Hooks)
────────────────────────
/* CountdownTimer.jsx */
import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ startTime, format, onFinished }) => {
  const [remaining, setRemaining] = useState(startTime);

  // Helper function to pad numbers with 0.
  const pad = (num) => String(num).padStart(2, '0');

  // Compute formatted time based on prop 'format'.
  const formattedTime = format === 0
    ? `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`
    : `${pad(Math.floor(remaining / 3600))}:${pad(Math.floor((remaining % 3600) / 60))}:${pad(remaining % 60)}`;

  // Check if time is low (<10% of original startTime).
  const isLow = remaining <= startTime * 0.1;

  useEffect(() => {
    // Set an interval to count down every second.
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onFinished) onFinished(); // call callback when finished.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinished, startTime]);

  return (
    <div style={{ color: isLow ? "red" : "black" }}>
      {formattedTime}
    </div>
  );
};

export default CountdownTimer;

/* Sample usage in a parent component */
// App.jsx
import React from 'react';
import CountdownTimer from './CountdownTimer';

function App() {
  const handleFinished = () => {
    console.log("Countdown complete!");
  };

  return (
    <div>
      <CountdownTimer startTime={120} format={0} onFinished={handleFinished} />
    </div>
  );
}

export default App;

────────────────────────
4. Vanilla JavaScript
────────────────────────
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Countdown Timer</title>
  <style>
    .countdown {
      font-size: 2rem;
      color: black;
    }
    .low {
      color: red;
    }
  </style>
</head>
<body>
  <!-- Container for the countdown timer -->
  <div id="countdown" class="countdown"></div>

  <script>
    // CountdownTimer Class (Vanilla JS version)
    class CountdownTimer {
      /**
       * @param {number} startTime - starting time in seconds
       * @param {number} format - display format: 0 = MM:SS, 1 = HH:MM:SS
       * @param {HTMLElement} element - DOM element to display the timer
       * @param {Function} onFinished - callback when countdown finishes
       */
      constructor(startTime, format, element, onFinished) {
        this.startTime = startTime;
        this.remaining = startTime;
        this.format = format;
        this.element = element;
        this.onFinished = onFinished;
        this.timer = null;
      }

      // Pads a number with leading zeros.
      pad(num) {
        return String(num).padStart(2, '0');
      }

      // Returns the formatted time string.
      getFormattedTime() {
        if (this.format === 0) { // MM:SS
          const minutes = Math.floor(this.remaining / 60);
          const seconds = this.remaining % 60;
          return `${this.pad(minutes)}:${this.pad(seconds)}`;
        } else { // HH:MM:SS
          const hours = Math.floor(this.remaining / 3600);
          const minutes = Math.floor((this.remaining % 3600) / 60);
          const seconds = this.remaining % 60;
          return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
        }
      }

      // Starts the countdown timer.
      start() {
        this.updateDisplay();
        this.timer = setInterval(() => {
          if (this.remaining > 0) {
            this.remaining--;
            this.updateDisplay();
          } else {
            clearInterval(this.timer);
            if (typeof this.onFinished === 'function') {
              this.onFinished();
            }
          }
        }, 1000);
      }

      // Updates the DOM element with the formatted time and visual low-time cue.
      updateDisplay() {
        this.element.textContent = this.getFormattedTime();
        // If remaining is less than 10% of the startTime, add a CSS class.
        if (this.remaining <= this.startTime * 0.1) {
          this.element.classList.add('low');
        } else {
          this.element.classList.remove('low');
        }
      }
    }

    // Sample usage:
    const countdownElement = document.getElementById('countdown');
    const timer = new CountdownTimer(120, 0, countdownElement, () => {
      console.log("Countdown complete!");
    });
    timer.start();
  </script>
</body>
</html>

────────────────────────
Explanation of Key Parts Across All Implementations:
────────────────────────
1. Props/Parameters:
   • "startTime" is the total seconds from which to count down.
   • "format" selects between two display formats: MM:SS (format=0) or HH:MM:SS (format=1).

2. Formatting:
   • A helper (pad) ensures that single-digit numbers have a leading zero.
   • Depending on the "format" prop, the time is formatted accordingly.

3. Countdown Logic:
   • A timer (setInterval) decreases the remaining seconds by one every second.
   • When the remaining time reaches zero, the timer stops and the finished event/callback is triggered.

4. Visual Indication:
   • A conditional style (red text color in our examples) is applied when remaining time falls below 10% of the original time.

Each version is self-contained and demonstrates both the component implementation and a sample usage. You can integrate these directly into your projects per your chosen framework.