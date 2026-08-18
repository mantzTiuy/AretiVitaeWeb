package com.av.Av.Services;

import com.av.Av.DTO.UserMapRequest;
import com.av.Av.models.User;
import com.av.Av.models.UserMap;
import com.av.Av.repository.UserMapRepository;
import com.av.Av.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
//eu amo minha vida
@Service
public class UserMapService {

    private static final int PLANO_BUILDER = 4;
    private static final int LIMITE_MAPAS = 50;

    @Autowired
    private UserMapRepository mapRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompraService compraService;

    public UserMap findById(int id){
        return mapRepository.findById(id).orElseThrow(() -> new RuntimeException("MAPA NAO ENCONTRADO"));
    }

    public UserMap cadastro(UserMapRequest request) {
        Integer userId = request.getUserId().intValue();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("USUARIO NAO ENCONTRADO"));

        Map<String, Object> status = compraService.statusAtivo(userId);
        Integer plano = Boolean.TRUE.equals(status.get("temAcesso")/*Chave de verificacao de ativacao de alguma compra*/) ? (Integer) status.get("plano") : 0;

        if (plano != PLANO_BUILDER) {
            long totalMapas = mapRepository.countByUser_Id(userId);
            if (totalMapas >= LIMITE_MAPAS) {
                throw new RuntimeException("Você atingiu o limite de " + LIMITE_MAPAS + " mapas");
            }
        }

        UserMap userMap = new UserMap();
        userMap.setUser(user);
        userMap.setData(request.getData());
        userMap.setTitle(request.getTitle());
        userMap.setDescription(request.getDescription());
        userMap.setAtivo(0); // 0 = ativo, garante que o ativo nunca fique null

        return mapRepository.save(userMap);
    }

    public List<UserMap> findByUserId(Integer userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("USUARIO NAO ENCONTRADO"));//Primeira camada de verificação (Contra a não presença de um usuário)

        List<UserMap> maps = mapRepository.findByUser_Id(userId);

        if (maps.isEmpty()) {
            throw new RuntimeException("ESSE USUARIO NAO TEM MAPAS CADASTRADOS");//Segunda camada de verificação, para caso o usuário existe mas não tenha mapas cadastrados
        }

        return maps;
    }

    public List<UserMap> findByUsername(String username) {
        userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("USUARIO NAO ENCONTRADO"));

        List<UserMap> maps = mapRepository.findByUser_UsernameAndAtivo(username, 0);

        if (maps.isEmpty()) {
            throw new RuntimeException("ESSE USUARIO NAO TEM MAPAS CADASTRADOS");
        }

        return maps;
    }

    public UserMap update(int id, UserMap updatedMap){
        UserMap existingMap = mapRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ID DE MAPA NAO ENCONTRADO"));

        if (updatedMap.getTitle() != null) {
            existingMap.setTitle(updatedMap.getTitle());
        }
        if (updatedMap.getDescription() != null) {
            existingMap.setDescription(updatedMap.getDescription());
        }
        if (updatedMap.getData() != null) {
            existingMap.setData(updatedMap.getData());
        }

        Integer ativo = updatedMap.getAtivo();
        if (ativo != null) {
            if (ativo != 0 && ativo != 1) {
                throw new IllegalArgumentException("ATIVO - 0 / DESATIVO - 1");
            }
            existingMap.setAtivo(ativo);
        }

        return mapRepository.save(existingMap);
    }

    public List<UserMap> findActiveMapsByUserId(Integer userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("USUARIO NAO ENCONTRADO"));

        List<UserMap> maps = mapRepository.findByUser_IdAndAtivo(userId, 0);

        if (maps.isEmpty()) {
            throw new RuntimeException("ESSE USUARIO NAO TEM MAPAS ATIVOS");
        }

        return maps;
    }

}