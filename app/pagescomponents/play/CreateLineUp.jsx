'use client';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import pitch from '@/app/assets/main/pitch.png';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

function CreateLineUp() {
  const [userData, setUserData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [formation, setFormation] = useState('');
  const [playerPositions, setPlayerPositions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [lineups, setLineups] = useState([]);
  const [newLineupName, setNewLineupName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);

          if (userData.teamId) {
            const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
            if (teamDoc.exists()) {
              const teamData = teamDoc.data();
              setTeamData(teamData);
              // Yetki kontrolü
              if (user.uid === teamData.captainId) {
                setIsAuthorized(true); // Kullanıcı kaptansa yetkilendirilir
              }
              await fetchUserData(user.uid);
            }
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);

        if (data.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', data.teamId));
          if (teamDoc.exists()) {
            const team = teamDoc.data();
            setTeamData(team);

            const membersQuery = query(
              collection(db, 'users'),
              where('teamId', '==', data.teamId)
            );
            const membersSnapshot = await getDocs(membersQuery);
            const members = membersSnapshot.docs.map((doc) => ({
              id: doc.id,
              name: doc.data().name,
              profileImage: doc.data().profileImage,
            }));
            setTeamMembers(members);
          }
        }
      }
    } catch (error) {
      console.error('Kullanıcı veya takım verisi alınırken hata oluştu:', error);
    }
  };


  const updateFormation = (formation) => {
    const formations = {
      '2-3-1': [
        { x: '40%', y: '80%' },
        { x: '60%', y: '80%' },
        { x: '20%', y: '50%' },
        { x: '50%', y: '50%' },
        { x: '80%', y: '50%' },
        { x: '50%', y: '20%' },
      ],
      '3-3': [
        { x: '20%', y: '80%' },
        { x: '50%', y: '80%' },
        { x: '80%', y: '80%' },
        { x: '20%', y: '35%' },
        { x: '50%', y: '35%' },
        { x: '80%', y: '35%' },
      ],
      '3-2-1': [
        { x: '20%', y: '80%' },
        { x: '50%', y: '80%' },
        { x: '80%', y: '80%' },
        { x: '30%', y: '50%' },
        { x: '70%', y: '50%' },
        { x: '50%', y: '20%' },
      ],
      '2-2-2': [
        { x: '30%', y: '80%' },
        { x: '70%', y: '80%' },
        { x: '30%', y: '50%' },
        { x: '70%', y: '50%' },
        { x: '30%', y: '20%' },
        { x: '70%', y: '20%' },
      ],
    };

    const updatedPositions = formations[formation].map((pos) => ({
      ...pos,
      player: null,
    }));
    setPlayerPositions(updatedPositions);
  };

  const handleSelectPlayer = (playerId) => {
    const selectedPlayer = teamMembers.find((member) => member.id === playerId);
    if (!playerPositions.some((pos) => pos.player?.id === playerId)) {
      setPlayerPositions((prev) =>
        prev.map((pos, index) =>
          index === selectedCard ? { ...pos, player: selectedPlayer } : pos
        )
      );
    }
    setSelectedCard(null);
  };

  const handleSaveLineup = async () => {
    try {
      if (!newLineupName) {
        alert('Lütfen bir kadro adı girin.');
        return;
      }

      if (playerPositions.some((pos) => !pos.player)) {
        alert('Lütfen tüm alanları doldurun.');
        return;
      }

      const validPositions = playerPositions.map((pos) => ({
        x: pos.x,
        y: pos.y,
        player: {
          id: pos.player.id,
          name: pos.player.name,
          profileImage: pos.player.profileImage,
        },
      }));
      const lineupRef = doc(db, `teams/${userData.teamId}/lineups`, newLineupName);
      await setDoc(lineupRef, { positions: validPositions, formation });

      alert('Kadro başarıyla kaydedildi!');
      setNewLineupName('');
      await fetchLineups();
    } catch (error) {
      console.error('Kadro kaydedilirken hata oluştu:', error);
    }
  };


  const fetchLineups = async () => {
    try {
      if (!userData?.teamId) return;

      const lineupsSnapshot = await getDocs(collection(db, `teams/${userData.teamId}/lineups`));
      const lineups = lineupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLineups(lineups);


    } catch (error) {
      console.error('Kadro bilgileri alınırken hata oluştu:', error);
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;
  }

  if (!userData) {
    return <div className="flex items-center justify-center h-screen">Giriş yapmalısınız.</div>;
  }

  if (!userData.teamId) {
    return <div className="flex items-center justify-center h-screen">Takımınız yok.</div>;
  }

  if (!isAuthorized) {
    return <div className="flex items-center justify-center h-screen">Yetkiniz Yok</div>;
  }


  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="mb-4">
        <Select
          value={formation}
          onValueChange={(value) => {
            setFormation(value);
            updateFormation(value);
          }}
          className="w-20 bg-background"
        >
          <SelectTrigger className="w-40 border rounded-md">
            <SelectValue placeholder="Formasyon Seç" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectGroup>
              <SelectLabel>Formasyon Seç</SelectLabel>
              <SelectItem value="2-3-1">2-3-1</SelectItem>
              <SelectItem value="3-3">3-3</SelectItem>
              <SelectItem value="3-2-1">3-2-1</SelectItem>
              <SelectItem value="2-2-2">2-2-2</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="Kadro Adı"
          value={newLineupName}
          onChange={(e) => setNewLineupName(e.target.value)}
          className="mt-2 p-2 border rounded-md"
        />
      </div>

      <div className="relative w-full md:w-[600px] h-[400px]">
        <Image
          src={pitch}
          layout="fill"
          alt="Lineup"
          className="border rounded-lg"
          objectFit="cover"
        />
        {playerPositions.map((pos, index) => (
          <div
            key={index}
            className="absolute w-16 h-16 rounded-full bg-button text-white flex items-center justify-center cursor-pointer"
            style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
            onClick={() => setSelectedCard(index)}
          >
            {pos.player ? (
              <img
                src={pos.player.profileImage}
                alt={pos.player.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className='text-slate-700'>+</span>
            )}
          </div>
        ))}
      </div>

      {selectedCard !== null && (
        <div className="absolute bg-white p-4 border rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-2">Oyuncu Seç</h2>
          <ScrollArea >
            {teamMembers.map((member) => (
              <p
                key={member.id}
                className="cursor-pointer hover:bg-gray-100 p-2"
                onClick={() => handleSelectPlayer(member.id)}
              >
                <img
                  src={member.profileImage}
                  alt={member.name}
                  className="inline-block w-8 h-8 rounded-full mr-2"
                />
                {member.name}
              </p>
            ))}
          </ScrollArea>
        </div>
      )}

      <Button
        className="mt-4 w-40 bg-button hover:bg-foreground text-slate-700 rounded-lg"
        onClick={handleSaveLineup}
      >
        Kaydet
      </Button>


    </div>
  );
}

export default CreateLineUp;
