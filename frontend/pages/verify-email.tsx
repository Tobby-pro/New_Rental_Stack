import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

const VerifyEmail: React.FC = () => {
  const router = useRouter();
  const { token } = router.query; // Extract token from query params
  const [message, setMessage] = useState<string>('Verifying email...');
  const [success, setSuccess] = useState<boolean>(false); // Track success status

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

  useEffect(() => {
    if (token && typeof token === 'string') {
      console.log("Initiating verification with token:", token);
      axios
        .get(`${apiUrl}/verify-email`, { params: { token } })
        .then((response) => {
          console.log("Response data:", response.data);
          setMessage(response.data.message); // Set message from response
          setSuccess(true); // Set success status to true
        })
        .catch((error) => {
          console.error('Error verifying email:', error);
          setMessage('An error occurred during verification.');
          setSuccess(false); // Ensure success status is false on error
        });
    }
  }, [token, apiUrl]);

  return (
    <div>
      <h1>Email Verification</h1>
      <p style={{ color: success ? 'green' : 'red' }}>{message}</p>
      {success && (
         <button onClick={() => router.push('/LandlordSignUp?mode=login')}>Go to Login</button>
      )}
    </div>
  );
};

export default VerifyEmail;
