import { createContext, useState} from 'react';


export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);


    const writeUser = (user) => {
        setUser(user);
    }

    return (
        <UserContext.Provider value={{ user, writeUser }}>
            {children}
        </UserContext.Provider>
    );
};
