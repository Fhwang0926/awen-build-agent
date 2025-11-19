<template>
  <div class="app">
    <header class="app-header">
      <h1>🚀 Vue 3 Sample Application</h1>
      <p>Welcome to the Vue 3 build agent test application!</p>
      
      <div class="counter-section">
        <h2>Counter Demo</h2>
        <p class="counter-display">Count: {{ count }}</p>
        <div class="button-group">
          <button @click="increment">Increment</button>
          <button @click="decrement">Decrement</button>
          <button @click="reset">Reset</button>
        </div>
      </div>

      <div class="info-section">
        <h3>Build Information</h3>
        <ul>
          <li>Framework: Vue 3</li>
          <li>Build Tool: Vite</li>
          <li>Status: Ready for deployment</li>
          <li>Reactive Count: {{ count }}</li>
        </ul>
      </div>

      <div class="features-section">
        <h3>Vue 3 Features Demo</h3>
        <div class="feature-card">
          <input 
            v-model="message" 
            type="text" 
            placeholder="Type something..."
            class="input-field"
          />
          <p class="message-display">{{ message || 'Your message will appear here' }}</p>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)
const message = ref('')

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}
</script>

<style scoped>
.app {
  text-align: center;
}

.app-header {
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
  padding: 20px;
}

h1 {
  margin-bottom: 10px;
  font-size: 2.5em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.counter-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 15px;
  margin: 30px 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.counter-display {
  font-size: 2em;
  font-weight: bold;
  margin: 20px 0;
  color: #42b883;
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

button {
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  border: none;
  color: white;
  padding: 12px 30px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 25px;
  transition: all 0.3s ease;
  font-weight: bold;
  box-shadow: 0 4px 15px 0 rgba(66, 184, 131, 0.4);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(66, 184, 131, 0.6);
}

button:active {
  transform: translateY(0);
}

.info-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px 40px;
  border-radius: 15px;
  margin-top: 20px;
  backdrop-filter: blur(10px);
}

.info-section h3 {
  margin-bottom: 15px;
  color: #42b883;
}

.info-section ul {
  list-style: none;
  padding: 0;
}

.info-section li {
  margin: 10px 0;
  font-size: 0.9em;
}

.features-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 15px;
  margin-top: 20px;
  backdrop-filter: blur(10px);
  max-width: 500px;
}

.features-section h3 {
  margin-bottom: 20px;
  color: #42b883;
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-field {
  padding: 12px 20px;
  border: 2px solid #42b883;
  border-radius: 25px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: #35495e;
  outline: none;
  transition: all 0.3s ease;
}

.input-field:focus {
  border-color: #35495e;
  box-shadow: 0 0 10px rgba(66, 184, 131, 0.5);
}

.message-display {
  padding: 15px;
  background: rgba(66, 184, 131, 0.2);
  border-radius: 10px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
}
</style>



