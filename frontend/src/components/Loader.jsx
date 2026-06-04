/**
 * Loader.jsx
 * ----------
 * Animated loading spinner with optional message.
 */

export default function Loader({ message = "Loading..." }) {
  return (
    <div className="loader-container">
      <div className="loader-spinner" />
      <p className="loader-text">{message}</p>
    </div>
  );
}
