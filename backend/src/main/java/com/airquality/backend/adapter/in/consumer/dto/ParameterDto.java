package com.airquality.backend.adapter.in.consumer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParameterDto {
    private String name;
    private String units;
    private String displayName;
}