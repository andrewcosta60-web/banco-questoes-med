import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

// Cria o contexto
export const AuthContext = createContext();

// Componente provider que envolve todo o app
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Monitora se o usuário tá logado (roda uma vez quando o app carrega)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Usuário tá logado - busca dados dele no Firestore
          const docRef = doc(db, 'usuarios', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUsuario({
              uid: user.uid,
              email: user.email,
              ...docSnap.data(), // Pega nome, dataCadastro, role, etc
            });
          } else {
            // Se não tiver dados no Firestore, cria perfil mínimo
            setUsuario({
              uid: user.uid,
              email: user.email,
            });
          }
        } else {
          // Usuário tá deslogado
          setUsuario(null);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    });

    return unsubscribe;
  }, []);

  // Função de REGISTRO
  const signup = async (nome, email, senha) => {
    setErro('');

    try {
      setCarregando(true);

      // Valida dados
      if (!nome || !email || !senha) {
        throw new Error('Preencha todos os campos');
      }

      if (senha.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      // Cria usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Salva dados complementares no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: nome,
        email: email,
        dataCadastro: new Date().toISOString(),
        role: 'student',
      });

      setUsuario({
        uid: user.uid,
        email: email,
        nome: nome,
        dataCadastro: new Date().toISOString(),
        role: 'student',
      });

      return true;
    } catch (error) {
      setErro(error.message);
      return false;
    } finally {
      setCarregando(false);
    }
  };

  // Função de LOGIN
  const login = async (email, senha) => {
    setErro('');

    try {
      setCarregando(true);

      // Valida dados
      if (!email || !senha) {
        throw new Error('Preencha email e senha');
      }

      // Faz login no Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Busca dados no Firestore
      const docRef = doc(db, 'usuarios', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUsuario({
          uid: user.uid,
          email: user.email,
          ...docSnap.data(),
        });
      } else {
        setUsuario({
          uid: user.uid,
          email: user.email,
        });
      }

      return true;
    } catch (error) {
      setErro(error.message);
      return false;
    } finally {
      setCarregando(false);
    }
  };

  // Função de LOGOUT
  const logout = async () => {
    setErro('');

    try {
      setCarregando(true);
      await signOut(auth);
      setUsuario(null);
      return true;
    } catch (error) {
      setErro(error.message);
      return false;
    } finally {
      setCarregando(false);
    }
  };

  // Objeto que será compartilhado com todo o app
  const value = {
    usuario,
    carregando,
    erro,
    setErro,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para usar o contexto facilmente
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}