let mediaRecorder;
let recordedChunks = [];
let timerInterval;
let seconds = 0;

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const saveButton = document.getElementById('saveButton');
const recordAgainButton = document.getElementById('recordAgainButton');
const fileName = document.getElementById('fileName');
const timer = document.getElementById('timer');
const recordingControls = document.getElementById('recordingControls');
const saveControls = document.getElementById('saveControls');
const startMessage = document.getElementById('startMessage');
const uploadStatus = document.getElementById('uploadStatus');

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimer() {
    seconds++;
    timer.textContent = formatTime(seconds);
    if (seconds >= 120) { // 2 minutes
        stopRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            showSaveControls();
        };

        mediaRecorder.start();
        seconds = 0;
        timerInterval = setInterval(updateTimer, 1000);
        
        startButton.classList.add('hidden');
        recordingControls.classList.remove('hidden');
        startMessage.classList.add('hidden');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Error accessing microphone. Please ensure you have granted permission.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(timerInterval);
        recordingControls.classList.add('hidden');
    }
}

function showSaveControls() {
    saveControls.classList.remove('hidden');
    saveButton.classList.add('bg-gray-300');
    saveButton.disabled = true;
}

async function handleSave() {
    if (!fileName.value || recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('fileName', fileName.value);

    uploadStatus.textContent = 'Uploading...';
    uploadStatus.classList.remove('hidden', 'text-red-500');
    uploadStatus.classList.add('text-blue-500');
    saveButton.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        uploadStatus.textContent = 'Upload successful!';
        uploadStatus.classList.remove('text-blue-500');
        uploadStatus.classList.add('text-green-500');
        
        saveButton.disabled = true;
        saveButton.classList.add('bg-gray-300');
        saveButton.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
    } catch (error) {
        console.error('Upload error:', error);
        uploadStatus.textContent = 'Upload failed. Please try again.';
        uploadStatus.classList.remove('text-blue-500');
        uploadStatus.classList.add('text-red-500');
        saveButton.disabled = false;
    }
}

function resetRecorder() {
    recordedChunks = [];
    seconds = 0;
    timer.textContent = '00:00';
    fileName.value = '';
    saveControls.classList.add('hidden');
    startButton.classList.remove('hidden');
    startMessage.classList.remove('hidden');
    saveButton.classList.add('bg-gray-300');
    saveButton.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
    saveButton.disabled = true;
    uploadStatus.classList.add('hidden');
}

// Event Listeners
startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
saveButton.addEventListener('click', handleSave);
recordAgainButton.addEventListener('click', resetRecorder);

fileName.addEventListener('input', () => {
    if (fileName.value) {
        saveButton.classList.remove('bg-gray-300');
        saveButton.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
        saveButton.disabled = false;
    } else {
        saveButton.classList.add('bg-gray-300');
        saveButton.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
        saveButton.disabled = true;
    }
});