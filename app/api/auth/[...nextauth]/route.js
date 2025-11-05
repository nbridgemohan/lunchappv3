import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await dbConnect();

        // Check if user exists in database
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          // New user - create temporary account without username/organization
          console.log('Creating new temporary user from Google SSO:', user.email);

          dbUser = await User.create({
            email: user.email,
            isEmailVerified: true, // Google accounts are pre-verified
            googleId: profile.sub,
            image: user.image,
            profileComplete: false, // User needs to complete profile
          });

          console.log('Temporary user created, needs profile completion');
        } else {
          // Existing user - update with Google info if needed
          console.log('Existing user logging in via Google SSO:', user.email);

          if (!dbUser.googleId) {
            dbUser.googleId = profile.sub;
          }
          if (user.image && !dbUser.image) {
            dbUser.image = user.image;
          }
          if (!dbUser.isEmailVerified) {
            dbUser.isEmailVerified = true; // Verify email if logging in via Google
          }
          await dbUser.save();
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }

      // Add profileComplete status to token
      if (token.email) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.profileComplete = dbUser.profileComplete || false;
          }
        } catch (error) {
          console.error('JWT callback error:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      try {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email });

        if (dbUser) {
          session.user.userId = dbUser._id.toString();
          session.user.username = dbUser.username;
          session.user.image = dbUser.image;
          session.user.profileComplete = dbUser.profileComplete || false;
        }
      } catch (error) {
        console.error('Session error:', error);
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Check if user needs to complete profile
      try {
        await dbConnect();

        // Extract email from the current session/token if available
        // This is a simplified check - in production you'd want to verify the session properly

        // If redirecting after sign in and not already on complete-profile page
        if (url === baseUrl || url === `${baseUrl}/`) {
          // The actual profile check will happen client-side
          return baseUrl;
        }

        if (url.startsWith('/')) return `${baseUrl}${url}`;
        else if (new URL(url).origin === baseUrl) return url;
        return baseUrl;
      } catch (error) {
        console.error('Redirect error:', error);
        return baseUrl;
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 60 minutes
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
