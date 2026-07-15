import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
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
        } else {
          setUsuario(null);
        }
      } catch (error) {
        console.error('Erro ao carregar usuario:', error);
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    });

    return unsubscribe;
  }, []);

  const signup = async (nome, email, senha, apelido = '') => {
    setErro('');

    try {
      setCarregando(true);

      if (!nome || !email || !senha) {
        throw new Error('Preencha todos os campos');
      }

      if (senha.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: nome,
        apelido: apelido || '',
        email: email,
        dataCadastro: new Date().toISOString(),
        role: 'student',
      });

      setUsuario({
        uid: user.uid,
        email: email,
        nome: nome,
        apelido: apelido || '',
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

  const login = async (email, senha) => {
    setErro('');

    try {
      setCarregando(true);

      if (!email || !senha) {
        throw new Error('Preencha email e senha');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

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

  // Atualiza nome e/ou apelido do usuario logado
  const atualizarPerfil = async (dadosAtualizados) => {
    setErro('');

    try {
      const docRef = doc(db, 'usuarios', usuario.uid);
      await updateDoc(docRef, dadosAtualizados);
      setUsuario((prev) => ({ ...prev, ...dadosAtualizados }));
      return true;
    } catch (error) {
      setErro(error.message);
      return false;
    }
  };

  // Troca a senha do usuario logado (exige a senha atual por seguranca)
  const trocarSenha = async (senhaAtual, senhaNova) => {
    setErro('');

    try {
      if (senhaNova.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }

      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, senhaNova);

      return true;
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErro('Senha atual incorreta');
      } else {
        setErro(error.message);
      }
      return false;
    }
  };

  const value = {
    usuario,
    carregando,
    erro,
    setErro,
    login,
    signup,
    logout,
    atualizarPerfil,
    trocarSenha,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}