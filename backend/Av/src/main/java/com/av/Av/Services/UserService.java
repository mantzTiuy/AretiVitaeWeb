package com.av.Av.Services;

import com.av.Av.models.User;
import com.av.Av.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public User cadastro(User user){

        if(userRepository.findByEmail(user.getEmail()).isPresent()){
            throw new RuntimeException("Esse email já foi cadastrado");
        }
        if(userRepository.findByUsername(user.getUsername()).isPresent()){
            throw new RuntimeException("Esse usuário já foi cadastrado");
        }
        String passwordCrypt = passwordEncoder.encode(user.getSenha());
        user.setSenha(passwordCrypt);
        return userRepository.save(user);
    }

    public User update(int id, User updatedUser){
        User existingUser = userRepository.findById((int) id).orElseThrow(() -> new RuntimeException("AvBot: U S U A R I O  N A O  E N C O N T R A D O"));

        if (updatedUser.getUsername() != null) {
            existingUser.setUsername(updatedUser.getUsername());
        }
        if (updatedUser.getEmail() != null) {
            existingUser.setEmail(updatedUser.getEmail());
        }
        if (updatedUser.getIdade() != 0) {
            existingUser.setIdade(updatedUser.getIdade());
        }
        if (updatedUser.getAssinatura() != 0) {
            existingUser.setAssinatura(updatedUser.getAssinatura());
        }
        if (updatedUser.getAtivo() != 0) {
            existingUser.setAtivo(updatedUser.getAtivo());
        }

        if(updatedUser.getSenha() != null && !updatedUser.getSenha().isEmpty()) {
            existingUser.setSenha(passwordEncoder.encode(updatedUser.getSenha()));
        }

        return userRepository.save(existingUser);
    }

    public User login(String email, String senha){
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Email não encontrado"));

        if (!passwordEncoder.matches(senha, user.getSenha())) {
            throw new RuntimeException("Senha incorreta");
        }
        return user;
    }

    public List<User> listActiveUsers() {
        return userRepository.findByAtivo(0);
    }

    public User findById(int id){
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("AvBot: U S U A R I O  N A O  E N C O N T R A D O"));
    }

    public User findByUsername(String username){
        return userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("AvBot: U S U A R I O  N A O  E N C O N T R A D O"));
    }

    public User findByEmail(String email){
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("AvBot: U S U A R I O  N A O  E N C O N T R A D O"));
    }

    public int getPlano(int id) {
        return findById(id).getAssinatura();
    }
}