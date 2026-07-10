package com.av.Av.controller;


import com.av.Av.DTO.UserMapRequest;
import com.av.Av.Services.UserMapService;
import com.av.Av.models.UserMap;
import com.av.Av.repository.UserMapRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/apiAvMap")
public class UserMapController {

    @Autowired
    UserMapRepository mapRepository;

    @Autowired
    UserMapService mapService;

    @GetMapping("/{id}")
    public UserMap findById(@PathVariable int id){
        return mapService.findById(id);
    }

    @PostMapping(value = "/Register")
    public ResponseEntity<UserMap> cadastro(@RequestBody UserMapRequest request){
        UserMap newUserMap = mapService.cadastro(request);

        return ResponseEntity.status(201).body(newUserMap);
    }

    @GetMapping("/userId/{userId}")
    public ResponseEntity<List<UserMap>/*Listagem de um objeto Usermap*/> findByUserId(@PathVariable Integer userId){
        return ResponseEntity.ok(mapService.findByUserId(userId));
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<List<UserMap>> findByUsername(@PathVariable String username){
        return ResponseEntity.ok(mapService.findByUsername(username));
    }

    @PutMapping(value = "/update/{id}")
    public ResponseEntity<UserMap> update(@RequestBody UserMap updatedMap, @PathVariable int id){
        UserMap userMap = mapService.update(id, updatedMap);
        return ResponseEntity.ok(userMap);
    }

    @GetMapping("/userIdActive/{userId}")
    public ResponseEntity<List<UserMap>> findActiveMapsByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(mapService.findActiveMapsByUserId(userId));
    }









}
