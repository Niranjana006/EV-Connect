import { useState, useEffect } from 'react';
  import { db } from '../services/firebase';
  import { collection, onSnapshot, DocumentData } from 'firebase/firestore';

  export const useFirestore = (collectionName: string) => {
    const [data, setData] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setData(items);
        setLoading(false);
      });
      return () => unsubscribe();
    }, [collectionName]);

    return { data, loading };
  };