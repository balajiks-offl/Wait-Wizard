
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  insert(ticket) {
    this.heap.push(ticket);
    this.bubbleUp(this.heap.length - 1);
  }

  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].priority >= this.heap[index].priority) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  bubbleDown(index) {
    while (true) {
      let largest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < this.heap.length && this.heap[left].priority > this.heap[largest].priority) {
        largest = left;
      }
      if (right < this.heap.length && this.heap[right].priority > this.heap[largest].priority) {
        largest = right;
      }
      if (largest === index) break;

      [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
      index = largest;
    }
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    if (this.heap.length > 0) this.bubbleDown(0);
    return max;
  }

  getAll() {
    return this.heap.map(item => ({ ...item }));
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

function roundRobinAssignment(tickets, doctors) {
  let doctorIndex = 0;
  return tickets.map(ticket => {
    const assignedDoctor = doctors[doctorIndex % doctors.length];
    doctorIndex++;
    return { ...ticket, assignedDoctor };
  });
}

function leastLoadAssignment(ticket, doctors, currentLoads) {
  let minLoad = Infinity;
  let selectedDoctor = null;

  doctors.forEach(doctor => {
    const load = currentLoads[doctor.id] || 0;
    if (load < minLoad) {
      minLoad = load;
      selectedDoctor = doctor;
    }
  });

  return selectedDoctor;
}

function findAvailableSlots(bookedSlots, startTime, endTime, slotDuration = 30) {
  const available = [];
  let currentTime = new Date(startTime);
  const endDateTime = new Date(endTime);

  const sortedSlots = bookedSlots
    .map(slot => ({
      start: new Date(slot.start),
      end: new Date(slot.end)
    }))
    .sort((a, b) => a.start - b.start);

  for (let slot of sortedSlots) {
    if (currentTime < slot.start) {
      available.push({
        start: new Date(currentTime),
        end: new Date(slot.start)
      });
    }
    currentTime = new Date(Math.max(currentTime, slot.end));
  }

  if (currentTime < endDateTime) {
    available.push({
      start: new Date(currentTime),
      end: new Date(endDateTime)
    });
  }

  return available;
}

async function exponentialBackoff(operation, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function calculateMovingAverage(waitTimes, windowSize = 10) {
  if (waitTimes.length === 0) return 0;
  if (waitTimes.length < windowSize) {
    return waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
  }

  const recent = waitTimes.slice(-windowSize);
  return recent.reduce((a, b) => a + b, 0) / windowSize;
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }

  clear() {
    this.cache.clear();
  }

  getSize() {
    return this.cache.size;
  }
}

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[str2.length][str1.length];
}

function fuzzySearch(query, items, searchField, threshold = 3) {
  return items
    .map(item => ({
      item,
      distance: levenshteinDistance(query.toLowerCase(), (item[searchField] || '').toLowerCase())
    }))
    .filter(result => result.distance <= threshold)
    .sort((a, b) => a.distance - b.distance)
    .map(result => result.item);
}

class NotificationBatcher {
  constructor(batchSize = 10, flushInterval = 5000) {
    this.batch = [];
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.timer = null;
  }

  add(notification) {
    this.batch.push(notification);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.batch.length === 0) return;

    const toSend = [...this.batch];
    this.batch = [];
    clearTimeout(this.timer);
    this.timer = null;

    return toSend;
  }

  getBatchSize() {
    return this.batch.length;
  }
}

class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  consume(amount = 1) {
    this.refill();
    if (this.tokens >= amount) {
      this.tokens -= amount;
      return true;
    }
    return false;
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  getAvailableTokens() {
    this.refill();
    return Math.floor(this.tokens);
  }
}

function knnRecommendation(symptoms, doctors, k = 3) {
  const symp = symptoms.toLowerCase().split(/[\s,]+/).filter(s => s);

  const distances = doctors.map(doctor => {
    const doctorSpecialties = (doctor.specialties || '')
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(s => s);

    const commonTerms = symp.filter(s => doctorSpecialties.includes(s));
    const similarity = commonTerms.length / Math.max(symp.length, doctorSpecialties.length);

    return {
      doctor,
      similarity
    };
  });

  distances.sort((a, b) => b.similarity - a.similarity);
  return distances.slice(0, k).filter(d => d.similarity > 0);
}

function getActiveTicketsInWindow(tickets, windowMinutes = 30) {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;

  return Object.values(tickets).filter(ticket => {
    const ticketTime = new Date(ticket.createdAt || ticket.timestamp).getTime();
    return now - ticketTime <= windowMs && (ticket.status === 'Open' || ticket.status === 'Booked');
  });
}

function calculateWaitTimeStats(tickets) {
  const completedTickets = Object.values(tickets).filter(t => t.status === 'Completed' && t.createdAt && t.completedAt);

  if (completedTickets.length === 0) {
    return { avgWaitTime: 0, medianWaitTime: 0, maxWaitTime: 0 };
  }

  const waitTimes = completedTickets.map(t => {
    const created = new Date(t.createdAt).getTime();
    const completed = new Date(t.completedAt).getTime();
    return (completed - created) / 1000 / 60;
  });

  waitTimes.sort((a, b) => a - b);

  const avgWaitTime = waitTimes.reduce((a, b) => a + b) / waitTimes.length;
  const medianWaitTime = waitTimes[Math.floor(waitTimes.length / 2)];
  const maxWaitTime = Math.max(...waitTimes);

  return {
    avgWaitTime: Math.round(avgWaitTime),
    medianWaitTime: Math.round(medianWaitTime),
    maxWaitTime: Math.round(maxWaitTime)
  };
}

function optimizeDoctorSchedule(tickets, doctors) {
  const doctorLoad = {};

  doctors.forEach(doc => {
    doctorLoad[doc.id] = 0;
  });

  Object.values(tickets).forEach(ticket => {
    if (ticket.doctorAssigned && ticket.status !== 'Completed') {
      doctorLoad[ticket.doctorAssigned] = (doctorLoad[ticket.doctorAssigned] || 0) + 1;
    }
  });

  return doctors
    .map(doc => ({
      doctor: doc,
      load: doctorLoad[doc.id] || 0
    }))
    .sort((a, b) => a.load - b.load);
}
