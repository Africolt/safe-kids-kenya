import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert,} from 'react-native';

const Onboarding = () => {
    const [email,setEmail ] = useState('');
    const [ password, setPassword ] = useState('');

    const handleSignUp = () => {
        if (!email || !password) {
            Alert.alert("Ooops!", "Please enter both email and password.");
            return;
        }
        Alert.alert("Success!", "We have your data stored.`Welcome ${email.split('@')[0]} 👋");
    };

    return (
        <View className="flex-1 bg-secondary justify-center px-6">
            {/* Logo/Title */}
        <View className="items-center mb-12">
            <Text className="text-5xl font-bold text-accent ">Safe Kids</Text>"
            <Text className="text-2xl text-primary mt-2">Kenya</Text>
            <Text className="text-sm text-accent/70 mt-2">Your child's safety, our priority.</Text>
        </View>

        {/* Form */}
        <View className="bg-light rounded-3xl p-8 shadow-sm">
            <Text className="text-2xl font-semibold text-accent mb-8 text-center">Create Your Account
            </Text>

            <TextInput
               className="bg-light border border-accent/30 rounded-2xl px-5 py-4 mb-4 text-lg"
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                className="bg-light border border-accent/30 rounded-2xl px-5 py-4 mb-8 text-lg"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                onPress={handleSignUp}
                className="bg-primary rounded-2xl py-4"
            >
              <Text className="text-center text-white text-lg font-semibold">
                Let's Get Started
              </Text>
            </TouchableOpacity>
        </View>
    </View>
    );
}

export default Onboarding;
