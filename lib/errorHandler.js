import Swal from 'sweetalert2';

/**
 * Parse error response and extract user-friendly message
 * Handles both string errors and JSON error objects like {"success":false,"error":"..."}
 */
function parseErrorMessage(error) {
  // If it's a string
  if (typeof error === 'string') {
    // Handle HTTP Error format: "HTTP Error 400: {...}"
    if (error.startsWith('HTTP Error')) {
      try {
        const match = error.match(/HTTP Error \d+: ({.*})/);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          return parsed.error || parsed.message || error;
        }
      } catch (e) {
        // If JSON parsing fails, extract the message part
        const parts = error.split(': ');
        return parts[1] || error;
      }
    }
    return error;
  }

  // If it's an object with error property
  if (error && typeof error === 'object') {
    if (error.error) return error.error;
    if (error.message) return error.message;
    if (error.data?.error) return error.data.error;
  }

  return error?.toString?.() || 'An unknown error occurred';
}

/**
 * Display error message using SweetAlert2
 * @param {string|object} error - Error message or error object
 * @param {string} title - Optional title for the alert (default: "Error")
 */
export function showError(error, title = 'Error') {
  const message = parseErrorMessage(error);

  Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonColor: '#ff6464',
    confirmButtonText: 'Okay',
    background: '#1a1a1a',
    color: '#fff',
    didOpen: (modal) => {
      modal.querySelector('.swal2-confirm').style.background = 'linear-gradient(to right, #ff6464, #ff4757)';
    },
  });
}

/**
 * Display success message using SweetAlert2
 * @param {string} message - Success message
 * @param {string} title - Optional title for the alert (default: "Success")
 */
export function showSuccess(message, title = 'Success') {
  Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonColor: '#4caf50',
    confirmButtonText: 'Great!',
    background: '#1a1a1a',
    color: '#fff',
    timer: 2000,
    timerProgressBar: true,
    didOpen: (modal) => {
      modal.querySelector('.swal2-confirm').style.background = 'linear-gradient(to right, #4caf50, #66bb6a)';
    },
  });
}

/**
 * Display info message using SweetAlert2
 * @param {string} message - Info message
 * @param {string} title - Optional title for the alert (default: "Info")
 */
export function showInfo(message, title = 'Info') {
  Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonColor: '#2196f3',
    confirmButtonText: 'OK',
    background: '#1a1a1a',
    color: '#fff',
    didOpen: (modal) => {
      modal.querySelector('.swal2-confirm').style.background = 'linear-gradient(to right, #2196f3, #1976d2)';
    },
  });
}

/**
 * Display confirmation dialog using SweetAlert2
 * @param {string} title - Title of the confirmation
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Confirm button text (default: "Yes, do it!")
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export function showConfirm(title, message, confirmText = 'Yes, do it!') {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: '#ff6b6b',
    cancelButtonColor: '#757575',
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    background: '#1a1a1a',
    color: '#fff',
    didOpen: (modal) => {
      modal.querySelector('.swal2-confirm').style.background = 'linear-gradient(to right, #ff6b6b, #ffd93d)';
      modal.querySelector('.swal2-cancel').style.background = '#555';
    },
  }).then((result) => result.isConfirmed);
}
